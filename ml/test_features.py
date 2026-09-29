import numpy as np
import pandas as pd

from features import cell_of, label, site_history, weather_features


def test_weather_ignores_the_sample_day():
    days = pd.date_range("2023-06-01", periods=20)
    rr = pd.Series(0.0, days)
    rr[days[15]] = 50.0
    w = weather_features(rr, pd.Series(15.0, days))
    assert w.loc[days[15], "rain_1d"] == 0  # the storm is on the sample day itself
    assert w.loc[days[16], "rain_1d"] == 50
    assert w.loc[days[17], "rain_2d"] == 50
    assert w.loc[days[17], "rain_1d"] == 0
    assert w.loc[days[16], "dry_days"] == 0
    assert w.loc[days[17], "dry_days"] == 1


def test_site_history_uses_earlier_samples_only():
    s = pd.DataFrame({
        "id": ["a", "a", "a"],
        "date": pd.to_datetime(["2023-06-01", "2023-06-10", "2023-06-20"]),
        "bad": [1, 0, 1],
        "ecoli": [2000, 100, 3000],
    })
    h = site_history(s)
    assert np.isnan(h.site_bad_rate.iloc[0])
    assert h.site_bad_rate.tolist()[1:] == [1.0, 0.5]
    assert h.last_log_ecoli.iloc[1] == np.log10(2001)
    assert h.days_since_last.iloc[2] == 10


def test_label_uses_annex_i_inland_values():
    df = pd.DataFrame({"ecoli": [1000, 1001, 10], "ie": [400, 10, 401]})
    assert label(df).tolist() == [0, 1, 1]


def test_cell_snaps_to_eobs_centres():
    lat, lon = cell_of(pd.Series([51.0445]), pd.Series([3.6846]))
    assert (lat[0], lon[0]) == (51.125, 3.625)
