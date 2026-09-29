# State

Where things stand now. Read this first after any break.

**Last updated:** 2026-09-29

## Built

| Part | State |
|---|---|
| `ml/fetch.py` | Pulls inland bathing-water sites and bacteria samples from EEA DiscoData. First run: 10,765 sites, 185,562 samples across 28 countries |
| Weather | E-OBS v33.0e daily rain (`rr`) and mean temperature (`tg`), 0.25 degree grid, 2011 to 2025, downloaded to `ml/data/raw/` |

## Next

1. Join samples to weather (features from the days before each sample only).
2. Train the bacteria model, grouped by site, report PR-AUC and recall.
3. Find the Ghent exceedances and check which followed heavy rain. That picks
   the backtest event.
4. Export the model and score it in the Next.js app.
5. FHIR server and the OAH profiles.
6. The three screens.

## Open questions

- Which Ghent exceedance to replay in the demo (depends on step 3).

## Facts that are easy to forget

- DiscoData rejects `ORDER BY`, system tables and `SELECT *` with `TOP`. Alias
  every table. Pages come back unordered, so `fetch.py` removes duplicates.
- The UK has no rows in the samples table.
- Weather for training comes from E-OBS, not Open-Meteo, because Open-Meteo's
  free tier counts a multi-year history for one location as dozens of calls.
  The live app uses the Open-Meteo forecast for five Ghent sites, which is
  within limits.
