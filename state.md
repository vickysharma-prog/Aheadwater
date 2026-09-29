# State

Where things stand now. Read this first after any break.

**Last updated:** 2026-09-29, evening

## Built

Live at **https://aheadwater.vercel.app** (Vercel project `vicky-sharma/aheadwater`,
deployed from `web/` with `npx vercel deploy --prod`).

| Part | State |
|---|---|
| `ml/fetch.py` | EEA inland sites and bacteria samples: 10,765 sites, 185,562 samples, 28 countries |
| `ml/features.py` | Training table from E-OBS weather and site history: 150,734 rows, 7,246 sites, 3,026 unsafe. 25 s |
| `ml/train.py` | LightGBM, about a minute on the laptop CPU. Writes model, metrics and a parity fixture to `web/data/` |
| `ml/export.py` | Ghent sites and samples, usual risk per site, the May 2021 backtest, a features fixture |
| `web/lib/` | Model scorer, features, live risk, hazards, photo checks, escalation ladder, cities and trust, FHIR bundle, browser store. 30 tests (`npm test`) |
| `/console` | Map, risk table, backtest chart, the seven steps. Whole flow clicked through on the live site: report, confirm, escalate, open to claim, claim from `/responder`, lab result, close, learn |
| `/public`, `/responder`, `/health`, `/fhir-explorer` | Built, load, share one incident across tabs |
| Bengaluru | Second demo city on the same code (city picker in the clock bar): the real Varthur Lake froth of 16 Aug 2017, CPCB 2017 monitoring, no risk score. Clicked through end to end |
| `/api/hazards` + panel | Algae, low oxygen and sewer-overflow rules on the Open-Meteo forecast, for both cities, plus Ghent's replay day. `lib/hazards.ts`, 4 tests |
| Photo check | `/public` report form: light and focus measured in the browser, MobileNet for water in frame. Tested in Chrome with a real Blaarmeersen photo (passes) and a blurred copy (turned back) |
| `/api/risk` + live panel | Today's Open-Meteo forecast scored for the four Ghent sites, shown on `/console` |
| `/fhir/*` | Read-only FHIR R4: metadata, read, search by `_id` and `status`, the transaction Bundle, our CodeSystem |
| FHIR validation | HL7 validator against the OAH profiles (built with SUSHI), on three Bundles (Ghent resolved, Ghent mid-incident, Bengaluru): 0 errors, 48 warnings. `fhir/README.md` |

## Next

1. Record the video from `docs/video.md` (local). Devpost text is in `docs/devpost.md` (local). The rules ask for no AI-use disclosure (checked 29 Sep).

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
17 May 2021, after 22 mm in three days. The model ranked it 7th of 314 samples.
In the daily replay (`web/data/backtest.json`), measured against the site's
usual risk of 0.0157: about 2x on 13 to 16 May after rain, then 0.086 on the
morning of the 17th, 5.5x usual, which crosses Watch. The score used weather up
to the 16th. The lab sample taken that day found enterococci at 489; lab
results take a day or more to come back. The other three came in dry
weather, so weather cannot explain them; in the product those are what the
citizen reports and lab results in the Detect stage are for.

Demo event: **GNT03, 17 May 2021.**

## Open questions

- None. Alert level settled as decision 13 in `project.md`.

## Facts that are easy to forget

- DiscoData rejects `ORDER BY`, system tables and `SELECT *` with `TOP`. Alias
  every table. Pages come back unordered, so `fetch.py` removes duplicates.
- The UK has no rows in the samples table.
- Docker does not run on this laptop, so no local HAPI server. The HL7 validator is the conformance check.
- Weather for training comes from E-OBS, not Open-Meteo, because Open-Meteo's
  free tier counts a multi-year history for one location as dozens of calls.
  The live app uses the Open-Meteo forecast for five Ghent sites, which is
  within limits.
