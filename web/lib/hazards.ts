// Rule-based checks for the hazards we have no labelled data to train on (decision 7).
// They run on weather alone, so they work in any city from day one.

export type Day = { date: string; rain: number; tmax: number; tmean: number; wind: number };
export type Level = "alert" | "watch" | "normal";
export type Hazard = { id: "algae" | "oxygen" | "flood"; name: string; level: Level; reason: string };

// Defaults. A city tunes these to its own water, as it learns what its lakes do.
export const RULES = {
  // Warm, calm weather favours cyanobacteria blooms (WHO, Toxic Cyanobacteria in Water, 2nd ed., 2021).
  algae: { warmWatch: 20, warmAlert: 23, calmWind: 10 }, // 7-day mean air temp in °C, 3-day mean wind in km/h
  // Warm water holds less oxygen; a first heavy rain after a dry spell washes organic load in.
  oxygen: { hot: 28, hotDays: 3, flushRain: 20, dryDays: 7 }, // °C, days, mm, days
  // Heavy daily rain is when combined sewers overflow.
  flood: { watch: 20, alert: 40 }, // mm in a day
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Hazards on days[i], from days up to and including i (a forecast day counts). */
export function hazards(days: Day[], i: number, r = RULES): Hazard[] {
  const upTo = (n: number) => days.slice(Math.max(0, i - n + 1), i + 1);

  const temp7 = mean(upTo(7).map((d) => d.tmean));
  const wind3 = mean(upTo(3).map((d) => d.wind));
  const calm = wind3 < r.algae.calmWind;
  const algae: Level = calm && temp7 >= r.algae.warmAlert ? "alert" : calm && temp7 >= r.algae.warmWatch ? "watch" : "normal";

  const hotRun = upTo(r.oxygen.hotDays);
  const hot = hotRun.length === r.oxygen.hotDays && hotRun.every((d) => d.tmax >= r.oxygen.hot);
  const flushDay = upTo(2).findIndex((d) => d.rain >= r.oxygen.flushRain);
  const start = Math.max(0, i - 1) + flushDay;
  const dryBefore = flushDay >= 0 && start >= r.oxygen.dryDays && days.slice(start - r.oxygen.dryDays, start).every((d) => d.rain < 1);
  const oxygen: Level = dryBefore && hot ? "alert" : dryBefore || hot ? "watch" : "normal";

  const rain = days[i].rain;
  const flood: Level = rain >= r.flood.alert ? "alert" : rain >= r.flood.watch ? "watch" : "normal";

  return [
    {
      id: "algae",
      name: "Algae bloom",
      level: algae,
      reason: `7-day mean ${temp7.toFixed(1)} °C, wind ${wind3.toFixed(0)} km/h${calm ? " (calm)" : ""}`,
    },
    {
      id: "oxygen",
      name: "Low oxygen, fish kill",
      level: oxygen,
      reason: [hot && `${r.oxygen.hotDays} days at ${r.oxygen.hot} °C or more`, dryBefore && "heavy rain after a dry spell"].filter(Boolean).join(", ") || "no heat run, no first flush",
    },
    { id: "flood", name: "Flash flood, sewer overflow", level: flood, reason: `${rain.toFixed(1)} mm in the day` },
  ];
}
