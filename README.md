# Aheadwater

Aheadwater warns a city before its river turns unsafe, then runs the response
until the problem is fixed.

A model trained on bacteria samples from 10,000 lake and river bathing sites
across Europe reads the weather and gives each site a risk score for the next
48 hours. When the risk is high, the city's water officer gets an incident,
nearby labs and volunteers are asked to help, the public health team sees which
districts are exposed, and the public page tells people to stay out of the
water. Every step is stored as an HL7 FHIR resource, using the OneAquaHealth
implementation guide.

Demo city: Ghent, Belgium.

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

## Data

- Bathing water samples: European Environment Agency, WISE Bathing Water
  Directive dataset, via DiscoData.
- Weather: E-OBS v33.0e (Cornes et al., 2018), Copernicus Climate Change
  Service and ECA&D.
- Health cohorts: OneAquaHealth FHIR sandbox, HL7 Europe.
