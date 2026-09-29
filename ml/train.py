"""Train the bacteria risk model and write model/bacteria.json plus model/metrics.json.

Two checks, both on sites or seasons the model never saw:
- 5-fold cross-validation grouped by site.
- Train on 2020-2023, test on 2024.
"""
import json
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, precision_recall_curve, roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold

from features import FEATURES, OUT as TRAIN

MODEL_DIR = Path(__file__).parent / "model"
PARAMS = dict(n_estimators=400, learning_rate=0.03, num_leaves=31, min_child_samples=50,
              subsample=0.8, subsample_freq=1, colsample_bytree=0.8, verbose=-1)
WEATHER_ONLY = [f for f in FEATURES if not f.startswith(("site_", "last_", "days_since"))]


def fit(X, y):
    return lgb.LGBMClassifier(**PARAMS).fit(X, y)


def scores(y, p, threshold):
    return {
        "pr_auc": round(average_precision_score(y, p), 3),
        "roc_auc": round(roc_auc_score(y, p), 3),
        "base_rate": round(float(y.mean()), 4),
        "recall_at_alert": round(float((p[y == 1] >= threshold).mean()), 3),
        "precision_at_alert": round(float(y[p >= threshold].mean()), 3),
        "alerts_per_100_samples": round(float((p >= threshold).mean() * 100), 2),
    }


def alert_threshold(y, p, min_precision=0.2):
    """Lowest risk score whose alerts are right at least min_precision of the time."""
    prec, _, thr = precision_recall_curve(y, p)
    ok = np.where(prec[:-1] >= min_precision)[0]
    return float(thr[ok[0]])


def grouped_cv(df, features):
    oof = np.zeros(len(df))
    folds = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=7)
    for tr, te in folds.split(df, df.bad, df.id):
        oof[te] = fit(df.iloc[tr][features], df.bad.iloc[tr]).predict_proba(df.iloc[te][features])[:, 1]
    return oof


def main():
    df = pd.read_parquet(TRAIN)
    y = df.bad.values
    report = {"rows": len(df), "sites": int(df.id.nunique()), "unsafe": int(y.sum())}

    oof = grouped_cv(df, FEATURES)
    threshold = alert_threshold(y, oof)
    report["alert_threshold"] = round(threshold, 4)
    report["grouped_cv"] = scores(y, oof, threshold)
    report["grouped_cv_weather_only"] = scores(y, grouped_cv(df, WEATHER_ONLY), threshold)

    past, future = df[df.date.dt.year < 2024], df[df.date.dt.year == 2024]
    p = fit(past[FEATURES], past.bad).predict_proba(future[FEATURES])[:, 1]
    report["train_2020_2023_test_2024"] = scores(future.bad.values, p, threshold)

    model = fit(df[FEATURES], y)
    report["importance"] = dict(sorted(
        zip(FEATURES, model.booster_.feature_importance("gain").round().astype(int).tolist()),
        key=lambda kv: -kv[1]))

    MODEL_DIR.mkdir(exist_ok=True)
    (MODEL_DIR / "bacteria.json").write_text(json.dumps(model.booster_.dump_model()))
    (MODEL_DIR / "metrics.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
