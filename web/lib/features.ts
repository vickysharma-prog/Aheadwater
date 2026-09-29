// The same features as ml/features.py, for one site and one target day.

export type Sample = { id: string; date: string; ecoli: number; ie: number; bad: number };

/** rain and temp run up to and including the day before the target day, oldest first. */
export function weatherFeatures(rain: number[], temp: number[]) {
  const last = (xs: number[], n: number) => xs.slice(-n);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const mean = (xs: number[]) => sum(xs) / xs.length;
  const lastWet = rain.findLastIndex((r) => r >= 1);
  return {
    rain_1d: sum(last(rain, 1)),
    rain_2d: sum(last(rain, 2)),
    rain_3d: sum(last(rain, 3)),
    rain_7d: sum(last(rain, 7)),
    rain_14d: sum(last(rain, 14)),
    rain_max_3d: Math.max(...last(rain, 3)),
    dry_days: Math.min(30, lastWet === -1 ? rain.length : rain.length - 1 - lastWet),
    temp_3d: mean(last(temp, 3)),
    temp_7d: mean(last(temp, 7)),
  };
}

/** The site's record from samples strictly before day (YYYY-MM-DD). */
export function siteHistory(samples: Sample[], day: string) {
  const past = samples.filter((s) => s.date < day).sort((a, b) => a.date.localeCompare(b.date));
  if (!past.length) return { site_n: 0, site_bad_rate: null, last_log_ecoli: null, days_since_last: null };
  const last = past[past.length - 1];
  return {
    site_n: past.length,
    site_bad_rate: past.reduce((a, s) => a + s.bad, 0) / past.length,
    last_log_ecoli: Math.log10(last.ecoli + 1),
    days_since_last: (Date.parse(day) - Date.parse(last.date)) / 86_400_000,
  };
}

export function dayOfYear(day: string) {
  const d = new Date(day + "T00:00:00Z");
  return (d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000 + 1;
}
