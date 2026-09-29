// Today's risk for the Ghent sites, from the Open-Meteo forecast.
import model from "../data/bacteria.json" with { type: "json" };
import ghent from "../data/ghent.json" with { type: "json" };
import usual from "../data/usual.json" with { type: "json" };

import { dayOfYear, siteHistory, weatherFeatures, type Sample } from "./features.ts";
import { scoreNamed, type Model } from "./model.ts";

export const ALERT_LEVEL = 0.1; // decision 13 in project.md
export const WATCH_MULTIPLE = 5;

export type Site = { id: string; name: string; lat: number; lon: number; zone: string };
const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());
export const SITES = (ghent.sites as Site[]).map((s) => ({ ...s, name: titleCase(s.name) }));
export const SAMPLES = ghent.samples as Sample[];

export type SiteRisk = { site: Site; day: string; risk: number; usual: number; level: "alert" | "watch" | "normal" };

/** The site's usual risk: median model score over its own past samples. */
export const usualRisk: Record<string, number> = usual;

export function level(risk: number, usual: number): SiteRisk["level"] {
  if (risk >= ALERT_LEVEL) return "alert";
  if (risk >= WATCH_MULTIPLE * usual) return "watch";
  return "normal";
}

export function riskFor(site: Site, day: string, rain: number[], temp: number[]): SiteRisk {
  const risk = scoreNamed(model as unknown as Model, {
    ...weatherFeatures(rain, temp),
    ...siteHistory(SAMPLES.filter((s) => s.id === site.id), day),
    doy: dayOfYear(day),
    is_river: site.zone === "riverBathingWater" ? 1 : 0,
    lat: site.lat,
  });
  const base = usualRisk[site.id];
  return { site, day, risk, usual: base, level: level(risk, base) };
}

type Forecast = { daily: { time: string[]; precipitation_sum: number[]; temperature_2m_mean: number[] } };

/** Risk for tomorrow and the day after. The forecast stands in for observed weather. */
export async function liveRisk(): Promise<SiteRisk[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: SITES.map((s) => s.lat).join(","),
    longitude: SITES.map((s) => s.lon).join(","),
    daily: "precipitation_sum,temperature_2m_mean",
    past_days: "14",
    forecast_days: "3",
    timezone: "Europe/Brussels",
  }).toString();
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data: Forecast[] = [(await res.json())].flat();

  return SITES.flatMap((site, i) => {
    const { time, precipitation_sum: rain, temperature_2m_mean: temp } = data[i].daily;
    const today = time.length - 3;
    // Day d is scored with weather up to d - 1.
    return [today + 1, today + 2].map((d) => riskFor(site, time[d], rain.slice(0, d), temp.slice(0, d)));
  });
}
