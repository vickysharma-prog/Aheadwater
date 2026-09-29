const TZ = "Europe/Brussels";

export const time = (iso: string | Date) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;

/** "in 12 min", "3 h 5 min ago" */
export function relative(target: Date, now: Date) {
  const min = Math.round((target.getTime() - now.getTime()) / 60_000);
  const abs = Math.abs(min);
  const text = abs >= 60 ? `${Math.floor(abs / 60)} h ${abs % 60} min` : `${abs} min`;
  return min >= 0 ? `in ${text}` : `${text} ago`;
}
