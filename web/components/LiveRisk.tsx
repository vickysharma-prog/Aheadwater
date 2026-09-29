"use client";
import { useEffect, useState } from "react";

import { LevelBadge } from "@/components/Console";
import { pct } from "@/lib/format";
import { SITES } from "@/lib/risk";

type Row = { id: string; day: string; risk: number; usual: number; level: "alert" | "watch" | "normal" };

/** Today's forecast-driven risk, next to the replay. */
export function LiveRisk() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/risk")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRows)
      .catch(() => setFailed(true));
  }, []);

  const days = rows ? [...new Set(rows.map((r) => r.day))] : [];
  const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-sm font-semibold">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ok" aria-hidden="true" />
        Live: risk from today&apos;s weather forecast
      </h2>
      {failed ? (
        <p className="px-4 py-3 text-sm text-slate-500">The forecast service did not answer. Try again in a minute.</p>
      ) : !rows ? (
        <p className="px-4 py-3 text-sm text-slate-500">Reading the forecast...</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Site</th>
              {days.map((d) => (
                <th key={d} className="px-2 py-2 font-medium">{fmt(d)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SITES.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{s.name}</td>
                {days.map((d) => {
                  const r = rows.find((x) => x.id === s.id && x.day === d)!;
                  return (
                    <td key={d} className="px-2 py-2">
                      <span className="mr-2 font-mono">{pct(r.risk)}</span>
                      <LevelBadge level={r.level} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        Open-Meteo forecast for Ghent, refreshed hourly. The forecast rain stands in for measured rain. The model is tuned for the bathing season, when sites are
        sampled.
      </p>
    </div>
  );
}
