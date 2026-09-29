# State

Where things stand now. Read this first after any break.

**Last updated:** 2026-09-29

## Built

| Part | State |
|---|---|
| `ml/fetch.py` | Pulls inland bathing-water sites and bacteria samples from EEA DiscoData. First run: 10,765 sites, 185,562 samples across 28 countries |
| Weather | E-OBS v33.0e daily rain (`rr`) and mean temperature (`tg`), 0.25 degree grid, 2011 to 2025, downloaded to `ml/data/raw/` |
| `ml/features.py` | One row per sample: rain and temperature from the days before it, plus the site's earlier record. 150,734 rows, 7,246 sites, 3,026 unsafe. Runs in 25 s. Tests in `test_features.py` |
| `ml/train.py` | LightGBM, trained on a laptop CPU in about a minute. Writes `ml/model/bacteria.json` and `metrics.json` |

## Next

1. Export the model and score it in the Next.js app.
2. FHIR server and the OAH profiles.
3. The three screens.

## Model results (29 Sep)

On sites the model never saw (5-fold, grouped by site): ROC-AUC 0.79, PR-AUC
0.147 against a base rate of 0.020. At the alert level, 1 alert in 5 is a real
exceedance, against 1 in 50 for a random pick, and 24% of exceedances are
caught. Trained on 2020 to 2023 and tested on 2024: ROC-AUC 0.77, so it holds
up on a later year. Weather alone gives ROC-AUC 0.73; the site's own record
adds the rest.

## Ghent backtest

Model trained without the Ghent sites, then scored on Ghent's 314 samples.
Ghent has four exceedances. One followed rain: Blaarmeersen GNT03 on
17 May 2021, after 22 mm in three days. The model ranked it 7th of 314 (risk
0.086, eight times the Ghent median of 0.011). In the daily replay (`web/data/backtest.json`) risk sat near 0.003 on 1 to 2 May, climbed to about 0.03 on 13 to 16 May after rain, and peaked at 0.086 on the 17th, when the lab found enterococci at 489. Each day's score uses weather up to the day before. The other three came in dry
weather, so weather cannot explain them; in the product those are what the
citizen reports and lab results in the Detect stage are for.

Demo event: **GNT03, 17 May 2021.**

## Open questions

- None. Alert level settled as decision 13 in `project.md`.

## Facts that are easy to forget

- DiscoData rejects `ORDER BY`, system tables and `SELECT *` with `TOP`. Alias
  every table. Pages come back unordered, so `fetch.py` removes duplicates.
- The UK has no rows in the samples table.
- Weather for training comes from E-OBS, not Open-Meteo, because Open-Meteo's
  free tier counts a multi-year history for one location as dozens of calls.
  The live app uses the Open-Meteo forecast for five Ghent sites, which is
  within limits.
