"""Build one training row per bacteria sample.

Every feature uses only what was known before the sample day: weather up to
the day before, and the site's own earlier samples.
"""
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

RAW = Path(__file__).parent / "data" / "raw"
OUT = Path(__file__).parent / "data" / "train.parquet"

# Annex I of Directive 2006/7/EC, "good quality" values for inland waters.
ECOLI_LIMIT, IE_LIMIT = 1000, 400
RAIN_WINDOWS = (1, 2, 3, 7, 14)
FEATURES = [f"rain_{n}d" for n in RAIN_WINDOWS] + [
    "rain_max_3d", "dry_days", "temp_3d", "temp_7d",
    "doy", "is_river", "lat", "site_bad_rate", "site_n", "last_log_ecoli", "days_since_last",
]


def label(df):
    return ((df.ecoli > ECOLI_LIMIT) | (df.ie > IE_LIMIT)).astype(int)


def weather_features(rr, tg):
    """rr, tg: daily Series for one grid cell. Row for day d describes days before d."""
    past_rr, past_tg = rr.shift(1), tg.shift(1)
    out = {f"rain_{n}d": past_rr.rolling(n).sum() for n in RAIN_WINDOWS}
    out["rain_max_3d"] = past_rr.rolling(3).max()
    wet = past_rr >= 1
    # Days since the last day with at least 1 mm, counting back from d-1.
    out["dry_days"] = (~wet).groupby(wet.cumsum()).cumsum().clip(upper=30)
    out["temp_3d"] = past_tg.rolling(3).mean()
    out["temp_7d"] = past_tg.rolling(7).mean()
    return pd.DataFrame(out)


def site_history(samples):
    """Per-site record from earlier samples only. samples must hold id, date, bad, ecoli."""
    s = samples.sort_values(["id", "date"]).copy()
    g = s.groupby("id")
    prior_bad = g.bad.cumsum() - s.bad
    s["site_n"] = g.cumcount()
    s["site_bad_rate"] = (prior_bad / s.site_n).where(s.site_n > 0)
    s["last_log_ecoli"] = np.log10(g.ecoli.shift(1) + 1)
    s["days_since_last"] = (s.date - g.date.shift(1)).dt.days
    return s


def cell_of(lat, lon):
    """Snap to the E-OBS 0.25 degree grid centres (x.125, x.375, ...)."""
    snap = lambda v: np.floor(v * 4) / 4 + 0.125
    return snap(lat).round(3), snap(lon).round(3)


def cell_series(path, var, cells):
    """Daily values for each cell, shape (days, cells). Reads the grid once, then indexes in memory."""
    grid = xr.open_dataset(path)[var].sel(
        time=slice("2019-11-01", "2024-12-31"), latitude=slice(34, 72), longitude=slice(-25, 45)
    ).load()
    lat_i = np.abs(grid.latitude.values[:, None] - cells.clat.values).argmin(0)
    lon_i = np.abs(grid.longitude.values[:, None] - cells.clon.values).argmin(0)
    return grid.values[:, lat_i, lon_i], pd.DatetimeIndex(grid.time.values)


def build():
    sites = pd.read_csv(RAW / "sites.csv")
    samples = pd.read_csv(RAW / "samples.csv", parse_dates=["date"])
    # Only scheduled and short-term pollution samples; the others repeat or replace them.
    samples = samples[samples.status.isna() | (samples.status == "shortTermPollutionSample")]
    samples = samples[samples.date >= "2020-01-01"].dropna(subset=["ecoli", "ie"])
    samples = samples.merge(sites[["id", "lat", "lon", "zone"]], on="id")
    samples["bad"] = label(samples)
    samples = site_history(samples)
    samples["clat"], samples["clon"] = cell_of(samples.lat, samples.lon)

    # E-OBS covers geographic Europe; overseas sites (Reunion, Guadeloupe...) fall outside it.
    samples = samples[samples.lat.between(34, 72) & samples.lon.between(-25, 45)]
    cells = samples[["clat", "clon"]].drop_duplicates()
    rr_c, days = cell_series(RAW / "rr.nc", "rr", cells)
    tg_c, _ = cell_series(RAW / "tg.nc", "tg", cells)

    frames = []
    for i, (clat, clon) in enumerate(cells.itertuples(index=False)):
        w = weather_features(pd.Series(rr_c[:, i], days), pd.Series(tg_c[:, i], days))
        w["clat"], w["clon"] = clat, clon
        frames.append(w.rename_axis("date").reset_index())
    weather = pd.concat(frames)

    df = samples.merge(weather, on=["clat", "clon", "date"], how="left")
    df["doy"] = df.date.dt.dayofyear
    df["is_river"] = (df.zone == "riverBathingWater").astype(int)
    df = df.dropna(subset=["rain_14d", "temp_7d"])  # sea cells or gaps in E-OBS
    df.to_parquet(OUT, index=False)
    return df


if __name__ == "__main__":
    df = build()
    print(len(df), "rows,", df.bad.sum(), "unsafe,", df.id.nunique(), "sites")
