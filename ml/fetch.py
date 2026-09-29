"""Pull inland bathing-water sites and their bacteria samples from EEA DiscoData.

Writes data/raw/sites.csv and data/raw/samples.csv. Weather comes from the
E-OBS grids (rr.nc, tg.nc) downloaded separately, see README.
"""
import json
import urllib.parse
import urllib.request
from pathlib import Path

import pandas as pd

API = "https://discodata.eea.europa.eu/sql"
DB = "[WISE_BWD].[latest]"
INLAND = "('riverBathingWater','lakeBathingWater')"
RAW = Path(__file__).parent / "data" / "raw"
PAGE = 20000


def sql(query, page=1, hits=PAGE):
    url = API + "?" + urllib.parse.urlencode({"query": query, "p": page, "nrOfHits": hits})
    with urllib.request.urlopen(url, timeout=300) as r:
        body = json.load(r)
    if "errors" in body:
        raise RuntimeError(f"{body['errors']} for {query}")
    return body["results"]


def all_pages(query):
    rows, page = [], 1
    while batch := sql(query, page):
        rows += batch
        page += 1
    return rows


def fetch_sites():
    rows = all_pages(
        f"SELECT s.thematicIdIdentifier id, s.nameText name, s.countryCode country, "
        f"s.specialisedZoneType zone, s.lat, s.lon, s.cYear "
        f"FROM {DB}.[spatial_ProtectedArea] s WHERE s.specialisedZoneType IN {INLAND}"
    )
    df = pd.DataFrame(rows).dropna(subset=["lat", "lon"])
    # A site is reported once per year; keep its latest position.
    return df.sort_values("cYear").drop_duplicates("id", keep="last").drop(columns="cYear")


def fetch_samples(countries):
    frames = []
    for c in countries:
        rows = all_pages(
            f"SELECT m.bathingWaterIdentifier id, m.sampleDate date, "
            f"m.escherichiaColiValue ecoli, m.intestinalEnterococciValue ie, m.sampleStatus status "
            f"FROM {DB}.[assessment_MonitoringResult] m WHERE m.countryCode='{c}' AND EXISTS "
            f"(SELECT 1 FROM {DB}.[spatial_ProtectedArea] s WHERE s.thematicIdIdentifier=m.bathingWaterIdentifier "
            f"AND s.specialisedZoneType IN {INLAND})"
        )
        print(c, len(rows))
        frames.append(pd.DataFrame(rows))
    # Pages come back unordered, so an overlap between pages is possible.
    return pd.concat(frames).drop_duplicates()


if __name__ == "__main__":
    RAW.mkdir(parents=True, exist_ok=True)
    sites = fetch_sites()
    sites.to_csv(RAW / "sites.csv", index=False)
    print("sites", len(sites))
    samples = fetch_samples(sorted(sites.country.unique()))
    samples.to_csv(RAW / "samples.csv", index=False)
    print("samples", len(samples))
