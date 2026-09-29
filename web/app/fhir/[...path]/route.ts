// A read-only FHIR R4 endpoint over the Ghent replay, played through to the end.
import { BASE, CODES, incidentBundle } from "@/lib/fhir";
import { RESOLVED_AT, resolvedIncident } from "@/lib/scenario";

const bundle = incidentBundle(resolvedIncident(), RESOLVED_AT);
const resources = bundle.entry.map((e) => e.resource as { resourceType: string; id: string; status?: string });
const TYPES = [...new Set(resources.map((r) => r.resourceType))];

const codeSystem = {
  resourceType: "CodeSystem",
  id: "aheadwater",
  url: CODES,
  status: "draft",
  content: "complete",
  name: "AheadwaterCodes",
  concept: [...new Set(JSON.stringify(bundle).match(new RegExp(`"system":"${CODES}","code":"[^"]+","display":"[^"]+"`, "g")) ?? [])].map((m) => {
    const [, code, display] = m.match(/"code":"([^"]+)","display":"([^"]+)"/)!;
    return { code, display };
  }).filter((c, i, all) => all.findIndex((x) => x.code === c.code) === i),
};

const capability = {
  resourceType: "CapabilityStatement",
  status: "active",
  date: "2026-09-29",
  kind: "instance",
  fhirVersion: "4.0.1",
  format: ["json"],
  implementation: { description: "Aheadwater incident data for the Ghent replay", url: BASE },
  instantiates: ["http://hl7.eu/fhir/ig/oah/ImplementationGuide/hl7.eu.fhir.oah"],
  rest: [{
    mode: "server",
    resource: [...TYPES, "CodeSystem"].map((type) => ({
      type,
      interaction: [{ code: "read" }, { code: "search-type" }],
      searchParam: [{ name: "_id", type: "token" }, ...(["Task", "DetectedIssue", "CareTeam", "Communication", "Observation"].includes(type) ? [{ name: "status", type: "token" }] : [])],
    })),
  }],
};

const fhir = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "content-type": "application/fhir+json", "access-control-allow-origin": "*" } });

const notFound = (text: string) =>
  fhir({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: text }] }, 404);

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const [type, id] = (await params).path;
  if (type === "metadata") return fhir(capability);
  if (type === "Bundle" && id === "ghent-incident") return fhir(bundle);
  const pool = type === "CodeSystem" ? [codeSystem] : resources.filter((r) => r.resourceType === type);
  if (!pool.length) return notFound(`No ${type} resources here. Try /fhir/metadata.`);
  if (id) return pool.find((r) => r.id === id) ? fhir(pool.find((r) => r.id === id)) : notFound(`${type}/${id} not found`);

  const q = new URL(req.url).searchParams;
  const hits = pool.filter((r) => (!q.get("_id") || r.id === q.get("_id")) && (!q.get("status") || r.status === q.get("status")));
  return fhir({
    resourceType: "Bundle",
    type: "searchset",
    total: hits.length,
    link: [{ relation: "self", url: `${BASE}/${type}${q.size ? `?${q}` : ""}` }],
    entry: hits.map((r) => ({ fullUrl: `${BASE}/${r.resourceType}/${r.id}`, resource: r, search: { mode: "match" } })),
  });
}
