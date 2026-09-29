"""Write the data the app needs into web/data/.

- ghent.json: Ghent's bathing sites and their sample history.
- backtest.json: daily risk at Blaarmeersen GNT03 in May 2021, from a model that
  never saw a Ghent sample, next to the rain and the lab results.
"""
import json

import numpy as np
import pandas as pd

from features import FEATURES, OUT as TRAIN, RAW, cell_of, cell_series, label, weather_features
from train import MODEL_DIR, fit

GHENT = ("BEVL_BW_GNT", "BEVL_BW_DEI")
EVENT_SITE, EVENT_DAY = "BEVL_BW_GNT03", "2021-05-17"


def history_on(day, past):
    """Site-history features for `day`, from samples strictly before it."""
    past = past[past.date < day]
    if past.empty:
        return dict(site_n=0, site_bad_rate=np.nan, last_log_ecoli=np.nan, days_since_last=np.nan)
    last = past.iloc[-1]
    return dict(site_n=len(past), site_bad_rate=past.bad.mean(),
                last_log_ecoli=np.log10(last.ecoli + 1), days_since_last=(day - last.date).days)


def main():
    sites = pd.read_csv(RAW / "sites.csv")
    samples = pd.read_csv(RAW / "samples.csv", parse_dates=["date"])
    samples = samples[samples.status.isna() | (samples.status == "shortTermPollutionSample")]
    ghent_sites = sites[sites.id.str.startswith(GHENT)]
    ghent = samples[samples.id.isin(ghent_sites.id)].sort_values("date").copy()
    ghent["bad"] = label(ghent)

    (MODEL_DIR / "ghent.json").write_text(json.dumps({
        "sites": ghent_sites[["id", "name", "lat", "lon", "zone"]].to_dict("records"),
        "samples": ghent.assign(date=ghent.date.dt.strftime("%Y-%m-%d"))
                        [["id", "date", "ecoli", "ie", "bad"]].to_dict("records"),
    }, indent=1))

    df = pd.read_parquet(TRAIN)
    blind = fit(*(lambda d: (d[FEATURES], d.bad))(df[~df.id.str.startswith(GHENT)]))

    site = ghent_sites.set_index("id").loc[EVENT_SITE]
    clat, clon = cell_of(pd.Series([site.lat]), pd.Series([site.lon]))
    cells = pd.DataFrame({"clat": clat, "clon": clon})
    rr, days = cell_series(RAW / "rr.nc", "rr", cells)
    tg, _ = cell_series(RAW / "tg.nc", "tg", cells)
    w = weather_features(pd.Series(rr[:, 0], days), pd.Series(tg[:, 0], days))
    window = pd.date_range("2021-05-01", "2021-05-31")
    past = ghent[ghent.id == EVENT_SITE]
    rows = pd.DataFrame([{**w.loc[d].to_dict(), **history_on(d, past), "doy": d.dayofyear,
                          "is_river": 0, "lat": site.lat} for d in window])
    risk = blind.predict_proba(rows[FEATURES])[:, 1]
    lab = past[past.date.isin(window)]
    (MODEL_DIR / "backtest.json").write_text(json.dumps({
        "site": EVENT_SITE, "name": site["name"], "event_day": EVENT_DAY,
        "note": "Model trained without any Ghent sample. Observed rain stands in for the forecast.",
        "days": [{"date": d.strftime("%Y-%m-%d"), "risk": round(float(r), 4),
                  "rain_mm": round(float(rr[days.get_loc(d), 0]), 1)} for d, r in zip(window, risk)],
        "lab": lab.assign(date=lab.date.dt.strftime("%Y-%m-%d"))[["date", "ecoli", "ie", "bad"]].to_dict("records"),
    }, indent=1))

    print(pd.DataFrame({"day": window.strftime("%m-%d"), "risk": risk.round(3), "rain": rr[[days.get_loc(d) for d in window], 0].round(1)}).to_string(index=False))
    print(lab)


if __name__ == "__main__":
    main()
