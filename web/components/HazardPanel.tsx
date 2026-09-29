"use client";
import { useEffect, useState } from "react";

import { LevelBadge } from "@/components/Console";
import type { Hazard } from "@/lib/hazards";
import type { CityId } from "@/lib/scenario";

type Row = { date: string; kind: "forecast" | "replay"; hazards: Hazard[] };

/** Algae, low oxygen and flood: rules on weather, next to the bacteria model. */
export function HazardPanel({ city }: { city: CityId }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/hazards?city=${city}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRows)
      .catch(() => setFailed(true));
  }, [city]);

  const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <h2 className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold">Other hazards: rules on the weather</h2>
      {failed ? (
        <p className="px-4 py-3 text-sm text-slate-500">The weather service did not answer. Try again in a minute.</p>
      ) : !rows ? (
        <p className="px-4 py-3 text-sm text-slate-500">Reading the weather...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Hazard</th>
                {rows.map((r) => (
                  <th key={r.date} className="px-2 py-2 font-medium">
                    {fmt(r.date)} <span className="font-normal text-slate-400">{r.kind === "replay" ? "replay" : "forecast"}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows[0].hazards.map((h) => (
                <tr key={h.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-2">{h.name}</td>
                  {rows.map((r) => {
                    const x = r.hazards.find((y) => y.id === h.id)!;
                    return (
                      <td key={r.date} className="px-2 py-2">
                        <LevelBadge level={x.level} />
                        <div className="mt-0.5 text-xs text-slate-500">{x.reason}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        No labelled data exists to train these, so they are rules: warm, calm weather for algae (WHO guidance), heat runs and first flushes for oxygen, heavy daily
        rain for sewer overflow. Default thresholds; each city tunes its own. They need no local samples, so they run in any city from day one.
      </p>
    </div>
  );
}
