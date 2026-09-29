# Aheadwater

Aheadwater warns a city before its river turns unsafe, then runs the response
until the problem is fixed.

A model trained on bacteria samples from 7,246 lake and river bathing sites
across Europe reads the weather and gives each site a risk score for the next
day. When the risk is high, the city's water officer gets an incident,
nearby labs and volunteers are asked to help, the public health team sees which
districts are exposed, and the public page tells people to stay out of the
water. Every step is stored as an HL7 FHIR resource, using the OneAquaHealth
implementation guide.

Demo cities: Ghent, Belgium (May 2021) and Bengaluru, India (August 2017),
both replaying real events. Live at **https://aheadwater.vercel.app**.

| Page | What it shows |
|---|---|
| `/console` | The water officer's view: map, next-day risk, the seven steps from prediction to learning |
| `/responder` | Labs, NGOs, wardens and vets: incidents near them, claim, close with evidence |
| `/public` | Is the water safe today, the advisory, and a report form |
| `/health` | The One Health cohort check, with real Oslo cohorts read from the OneAquaHealth sandbox |
| `/fhir-explorer` | Every FHIR resource in the incident |
| `/fhir/metadata` | A read-only FHIR R4 endpoint (`/fhir/Task`, `/fhir/DetectedIssue/...`, `/fhir/Bundle/ghent-incident`) |

Open the console, the responder view and the public page in three tabs: they
share one incident, kept in your browser, and the Reset button starts over.

The brief and the decisions behind it are in [`project.md`](project.md).

## Run the data pipeline

```sh
cd ml
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # bin/pip on macOS and Linux
python fetch.py                                 # EEA sites and samples
```

Download the E-OBS weather grids into `ml/data/raw/`:

- `rr.nc`: https://knmi-ecad-assets-prd.s3.amazonaws.com/ensembles/data/Grid_0.25deg_reg_ensemble/rr_ens_mean_0.25deg_reg_2011-2025_v33.0e.nc
- `tg.nc`: https://knmi-ecad-assets-prd.s3.amazonaws.com/ensembles/data/Grid_0.25deg_reg_ensemble/tg_ens_mean_0.25deg_reg_2011-2025_v33.0e.nc

## Run the app

```sh
cd web
npm install
npm run dev      # http://localhost:3000
npm test         # model parity with Python, features, escalation ladder, FHIR bundle
```

FHIR validation against the OneAquaHealth profiles: see [`fhir/README.md`](fhir/README.md).

## Model

LightGBM on 150,734 samples from 7,246 lake and river bathing sites in 27
countries, 2020 to 2024. Features: rain over the previous 1 to 14 days, the
heaviest day in the last three, dry days, temperature, day of year, and the
site's own earlier record. Every feature uses only data from before the sample
day. Tested on sites it never saw (5-fold, grouped by site): ROC-AUC 0.79,
PR-AUC 0.147 against a base rate of 0.020. Full figures in
[`web/data/metrics.json`](web/data/metrics.json).

```sh
cd ml
python features.py   # training table
python train.py      # model, metrics
python export.py     # Ghent data and the backtest for the app
pytest
```

## Data

- Bathing water samples: European Environment Agency, WISE Bathing Water
  Directive dataset, via DiscoData.
- Weather: E-OBS v33.0e (Cornes et al., 2018), Copernicus Climate Change
  Service and ECA&D.
- Health cohorts: OneAquaHealth FHIR sandbox, HL7 Europe.
- Bengaluru lakes: Central Pollution Control Board, National Water Quality
  Monitoring Programme 2017 (lakes, ponds and tanks, Karnataka); bathing
  criteria from Schedule I, item 93 of the Environment (Protection) Rules.
