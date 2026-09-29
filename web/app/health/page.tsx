// The One Health step: who lives near the incident, and the same cohort query run on real data.
import { SITE } from "@/lib/scenario";

export const metadata = { title: "Health cohorts · Aheadwater" };
export const revalidate = 86400;

const SANDBOX = "https://sandbox.hl7europe.eu/oneaquahealth/fhir";

type Obs = { id: string; code?: { text?: string; coding?: { display?: string }[] }; valueQuantity?: { value: number; unit?: string }; focus?: { reference: string }[] };

async function osloCohorts() {
  try {
    const res = await fetch(`${SANDBOX}/Observation?subject=Location/Loc-Nordre-Aker&_count=200&_elements=code,valueQuantity,focus`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    const bundle = await res.json();
    return ((bundle.entry ?? []) as { resource: Obs }[]).map((e) => e.resource);
  } catch {
    return null;
  }
}

const SYNTHETIC = [
  { id: "ghent-blaarmeersen-2km-all", label: "Everyone living within 2 km of Blaarmeersen" },
  { id: "ghent-blaarmeersen-2km-age-0-12", label: "Children aged 0 to 12 within 2 km" },
  { id: "ghent-blaarmeersen-2km-age-70-plus", label: "People aged 70 and over within 2 km" },
];

export default async function Page() {
  const oslo = await osloCohorts();
  const label = (o: Obs) => o.code?.text ?? o.code?.coding?.[0]?.display ?? "";
  const measures = oslo ? [...new Set(oslo.map(label))].filter(Boolean).slice(0, 6) : [];
  const groups = oslo ? [...new Set(oslo.map((o) => o.focus?.[0]?.reference.replace("Group/Group-OS-", "") ?? ""))].filter(Boolean) : [];
  const cell = (g: string, m: string) => oslo?.find((o) => label(o) === m && o.focus?.[0]?.reference === `Group/Group-OS-${g}`)?.valueQuantity;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">One Health: who is exposed</h1>
        <p className="max-w-3xl text-slate-600">
          When the officer confirms an incident at {SITE.name}, Aheadwater looks up the population cohorts for that district and tells the public health team and local
          vets which groups to watch over the next week. Cohorts are FHIR <code>Group</code> resources on the OneAquaHealth <code>group-oah</code> profile, so health
          data never leaves the health system as individual records.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="flex-1 font-semibold">Ghent, Blaarmeersen district</h2>
          <span className="rounded bg-watch-soft px-2 py-0.5 text-xs font-semibold text-watch">Synthetic cohorts</span>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          The OneAquaHealth sandbox holds no Ghent cohorts yet, so these three are defined by us to show the link. They carry no counts and no real health data.
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {SYNTHETIC.map((g) => (
            <li key={g.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <div className="font-medium">{g.label}</div>
              <div className="mt-1 font-mono text-xs text-slate-400">Group/{g.id}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-water-soft p-3">
            <div className="font-medium text-water">Public health team</div>
            Watch GP reports of stomach illness and skin rashes in these cohorts for 7 days after contact. Children and older people first.
          </div>
          <div className="rounded-md bg-water-soft p-3">
            <div className="font-medium text-water">Vets</div>
            Report dogs with vomiting or diarrhoea after swimming at Blaarmeersen. Animals often show it first.
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="flex-1 font-semibold">The same query on real data: Oslo, Nordre Aker</h2>
          <span className="rounded bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">Live from the OneAquaHealth sandbox</span>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          <code className="text-xs">GET {SANDBOX}/Observation?subject=Location/Loc-Nordre-Aker</code>, read when this page is built and cached for a day. Aheadwater only reads
          from the sandbox.
        </p>
        {oslo ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Cohort</th>
                  {measures.map((m) => (
                    <th key={m} className="px-2 py-2 font-medium">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3">{g.replaceAll("-", " ")}</td>
                    {measures.map((m) => {
                      const v = cell(g, m);
                      return <td key={m} className="px-2 py-1.5 font-mono">{v ? `${v.value}${v.unit === "%" ? "%" : ` ${v.unit ?? ""}`}` : "–"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">The sandbox did not answer just now. The query runs again on the next visit.</p>
        )}
      </section>
    </div>
  );
}
