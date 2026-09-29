// Rule-based hazards for a demo city: today and tomorrow from the forecast, plus Ghent's replay day.
import { hazards, type Day } from "@/lib/hazards";
import { CITIES, type CityId } from "@/lib/scenario";

type Daily = { time: string[]; precipitation_sum: number[]; temperature_2m_max: number[]; temperature_2m_mean: number[]; wind_speed_10m_mean: number[] };

async function weather(host: string, lat: number, lon: number, tz: string, extra: Record<string, string>): Promise<Day[]> {
  const url = new URL(`https://${host}/v1/${host.startsWith("archive") ? "archive" : "forecast"}`);
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "precipitation_sum,temperature_2m_max,temperature_2m_mean,wind_speed_10m_mean",
    timezone: tz,
    ...extra,
  }).toString();
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const d: Daily = (await res.json()).daily;
  return d.time.map((date, i) => ({
    date,
    rain: d.precipitation_sum[i] ?? 0,
    tmax: d.temperature_2m_max[i],
    tmean: d.temperature_2m_mean[i],
    wind: d.wind_speed_10m_mean[i],
  }));
}

export async function GET(req: Request) {
  const city = CITIES[(new URL(req.url).searchParams.get("city") as CityId) ?? "ghent"] ?? CITIES.ghent;
  const { lat, lon } = city.focus;
  try {
    const live = await weather("api.open-meteo.com", lat, lon, city.tz, { past_days: "10", forecast_days: "2" });
    const out = [live.length - 2, live.length - 1].map((i) => ({ date: live[i].date, kind: "forecast", hazards: hazards(live, i) }));
    if (city.id === "ghent") {
      const replay = await weather("archive-api.open-meteo.com", lat, lon, city.tz, { start_date: "2021-05-05", end_date: "2021-05-17" });
      out.unshift({ date: "2021-05-17", kind: "replay", hazards: hazards(replay, replay.length - 1) });
    }
    return Response.json(out, { headers: { "cache-control": "public, s-maxage=3600" } });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
