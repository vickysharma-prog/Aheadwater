"use client";
import { useState } from "react";

import validation from "@/data/validation.json";
import { incidentBundle } from "@/lib/fhir";
import { RESOLVED_AT, resolvedIncident } from "@/lib/scenario";
import { useDemo } from "@/lib/store";

type Res = { resourceType: string; id: string; meta?: { profile?: string[] } };

export function FhirExplorer() {
  const demo = useDemo();
  const yours = !!demo.incident;
  const bundle = demo.incident ? incidentBundle(demo.incident, new Date(demo.clock)) : incidentBundle(resolvedIncident(), RESOLVED_AT);
  const resources = bundle.entry.map((e) => e.resource as Res);
  const [pick, setPick] = useState(0);
  const current = resources[Math.min(pick, resources.length - 1)];

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">The incident as FHIR</h1>
          <p className="max-w-3xl text-slate-600">
            {yours ? "Your run of the Ghent replay" : "The Ghent replay played through to the end"}, as one FHIR R4 transaction Bundle. Location and
            Observation use the OneAquaHealth profiles; DetectedIssue, Task, CareTeam and Communication are base R4.
          </p>
        </div>
        <div className="rounded-lg border border-ok bg-ok-soft px-3 py-2 text-sm text-ok">
          <div className="font-semibold">
            {validation.errors} errors, {validation.warnings} warnings
          </div>
          <div className="text-xs">{validation.validator}, OAH profiles, {validation.date}</div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        {["metadata", "Task", "DetectedIssue", "Observation?status=final", "Bundle/ghent-incident", "CodeSystem/aheadwater"].map((p) => (
          <a key={p} href={`/fhir/${p}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs hover:border-water hover:text-water">
            GET /fhir/{p}
          </a>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <ul className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white text-sm">
          {resources.map((r, i) => (
            <li key={`${r.resourceType}/${r.id}`}>
              <button
                onClick={() => setPick(i)}
                className={`w-full border-b border-slate-100 px-3 py-2 text-left ${i === pick ? "bg-water-soft" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.resourceType}</span>
                  {r.meta?.profile?.some((p) => p.includes("/ig/oah/")) && <span className="rounded bg-water px-1.5 text-[10px] font-semibold text-white">OAH</span>}
                </div>
                <div className="truncate font-mono text-xs text-slate-500">{r.id}</div>
              </button>
            </li>
          ))}
        </ul>
        <pre className="max-h-[70vh] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
          {JSON.stringify(current, null, 2)}
        </pre>
      </div>
    </div>
  );
}
