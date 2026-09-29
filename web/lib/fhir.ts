// Turns an incident into a FHIR R4 transaction Bundle.
// Location and Observation follow the OneAquaHealth profiles; the rest is base R4.
import { incidentState, LIMITS } from "./incident.ts";
import { CITIES, type City, type Incident } from "./scenario.ts";

const OAH = "http://hl7.eu/fhir/ig/oah/StructureDefinition";
export const BASE = "https://aheadwater.vercel.app/fhir";
export const CODES = `${BASE}/CodeSystem/aheadwater`;
const UCUM = "http://unitsofmeasure.org";

type Resource = { resourceType: string; id: string; [k: string]: unknown };

/** FHIR ids allow letters, digits, "-" and "." only. */
export const fhirId = (s: string) => s.toLowerCase().replace(/[^a-z0-9.-]/g, "-").slice(0, 64);

const ref = (r: Resource, display?: string) => ({ reference: `${r.resourceType}/${r.id}`, ...(display && { display }) });
const code = (c: string, display: string) => ({ coding: [{ system: CODES, code: c, display }], text: display });
// Marks demo actors and simulated workflow; the site, the risk score and the lab results are real.
const SYNTHETIC = { system: "http://terminology.hl7.org/CodeSystem/v3-ActReason", code: "HTEST", display: "test health data" };

/** The synthetic cohorts for a district: people living near the site, by age. */
export const cohorts = (city: City) => {
  const slug = `${city.id}-${fhirId(city.district)}-2km`;
  return [
    { id: `${slug}-all`, label: `Everyone living within 2 km of ${city.district}`, age: undefined as number[] | undefined },
    { id: `${slug}-age-0-12`, label: "Children aged 0 to 12 within 2 km", age: [0, 12] as number[] },
    { id: `${slug}-age-70-plus`, label: "People aged 70 and over within 2 km", age: [70] as number[] },
  ];
};

const category = (c: string) => [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: c }] }];

export function incidentBundle(inc: Incident, now: Date) {
  const state = incidentState(inc.severity, inc.events, now);
  const cfg = CITIES[inc.city];
  const city: Resource = { resourceType: "Organization", id: `${cfg.id}-water`, name: cfg.owner };
  const officer: Resource = {
    resourceType: "PractitionerRole",
    id: `${cfg.id}-water-officer`,
    organization: ref(city),
    code: [{ text: "Water officer, incident owner" }],
  };

  const location: Resource = {
    resourceType: "Location",
    id: fhirId(inc.site.id),
    meta: { profile: [`${OAH}/location-oah`] },
    identifier: [{ system: cfg.id === "ghent" ? "https://www.eea.europa.eu/bathing-water-id" : `${BASE}/site`, value: inc.site.id }],
    name: inc.site.name,
    mode: "instance",
    type: [{ text: { riverBathingWater: "River bathing water", lakeBathingWater: "Lake bathing water" }[inc.site.zone] ?? "Urban lake" }],
    position: { latitude: inc.site.lat, longitude: inc.site.lon },
  };

  const obs = (id: string, extra: object): Resource => ({
    resourceType: "Observation",
    id,
    meta: { profile: [`${OAH}/observation-indicators-oah`] },
    status: "final",
    subject: ref(location),
    ...extra,
  });

  const risk = inc.risk && obs(`${inc.id}-risk`, {
    category: category("survey"),
    code: code("bacteria-risk", "Probability the next bathing-water sample breaks the limit"),
    effectiveDateTime: inc.risk.day,
    performer: [ref(city)],
    method: { text: "Aheadwater bacteria model: gradient boosted trees on EEA samples and E-OBS weather" },
    valueQuantity: { value: inc.risk.value, unit: "probability", system: UCUM, code: "1" },
    referenceRange: [{ high: { value: inc.risk.usual * 5, system: UCUM, code: "1" }, text: "Watch level: 5x the site's usual risk" }],
  });

  const citizen = inc.citizen && obs(`${inc.id}-citizen`, {
    category: category("survey"),
    code: code("citizen-report", "Citizen water report"),
    effectiveDateTime: inc.citizen.at,
    performer: [{ display: "Citizen reporter" }],
    valueCodeableConcept: { text: inc.citizen.text },
  });

  const stat = (code: string) => ({ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-statistics", code }] });
  const labs = [...(inc.prior ? [inc.prior] : []), ...inc.lab].flatMap((l) =>
    l.measures.map((m) => {
      const q = (value: number) => ({ value, unit: m.unit, system: UCUM, code: m.ucum });
      return obs(`${inc.id}-lab-${l.date}-${m.code}`, {
        ...(m.value === undefined && { meta: { profile: [`${OAH}/observation-with-component-oah`] } }),
        category: category("laboratory"),
        code: code(m.code, `${m.display} in water`),
        ...(l.period ? { effectivePeriod: { start: l.period[0], end: l.period[1] } } : { effectiveDateTime: l.date }),
        performer: l.source ? [{ display: l.source }] : [ref(city)],
        ...(m.value !== undefined
          ? { valueQuantity: q(m.value) }
          : { component: [{ code: stat("minimum"), valueQuantity: q(m.low!) }, { code: stat("maximum"), valueQuantity: q(m.high!) }] }),
        referenceRange: [{ high: q(m.limit) }],
      });
    }),
  );

  const evidence = [risk, citizen, ...labs].filter(Boolean) as Resource[];

  const district: Resource = {
    resourceType: "Location",
    id: `${cfg.id}-${fhirId(cfg.district)}-2km`,
    meta: { profile: [`${OAH}/location-oah`] },
    identifier: [{ system: `${BASE}/district`, value: `${cfg.id}-${fhirId(cfg.district)}-2km` }],
    name: `Residential area within 2 km of ${cfg.district}`,
    mode: "instance",
    position: { latitude: inc.site.lat, longitude: inc.site.lon },
  };
  const years = (value: number) => ({ value, unit: "years", system: UCUM, code: "a" });
  const groups: Resource[] = cohorts(cfg).map((c) => ({
    resourceType: "Group",
    id: c.id,
    meta: { profile: [`${OAH}/group-oah`] },
    name: c.label,
    type: "person",
    actual: false,
    characteristic: [
      ...(c.age
        ? [{
            code: { coding: [{ system: "http://loinc.org", code: "30525-0", display: "Age" }] },
            valueRange: { low: years(c.age[0]), ...(c.age[1] !== undefined && { high: years(c.age[1]) }) },
            exclude: false,
          }]
        : []),
      { code: { coding: [{ system: "http://snomed.info/sct", code: "20733006", display: "Living place" }] }, valueReference: ref(district), exclude: false },
    ],
  }));
  const byType = (t: string) => inc.events.find((e) => e.type === t && new Date(e.at) <= now);

  const responder: Resource | undefined = inc.responder && {
    resourceType: "Organization",
    id: `responder-${inc.responder.id}`,
    name: inc.responder.name,
  };

  const responderRole: Resource | undefined = responder && {
    resourceType: "PractitionerRole",
    id: `${responder.id}-role`,
    organization: ref(responder),
    code: [{ text: "Responder" }],
  };

  const issue: Resource = {
    resourceType: "DetectedIssue",
    id: inc.id,
    status: byType("resolved") ? "final" : "preliminary",
    code: code("unsafe-bathing-water", "Bathing water likely unsafe for contact"),
    severity: inc.severity === "high" ? "high" : "moderate",
    identifiedDateTime: inc.events[0].at,
    author: ref(officer),
    implicated: [ref(location)],
    evidence: [{ detail: evidence.map((r) => ref(r)) }],
    detail: inc.advisory,
    mitigation: inc.events
      .filter((e) => e.type !== "opened" && new Date(e.at) <= now)
      .map((e) => ({ action: code(e.type, e.type), date: e.at, author: ref(e.by === "Water officer" || !responderRole ? officer : responderRole, e.by) })),
  };

  const careTeam: Resource = {
    resourceType: "CareTeam",
    id: `${inc.id}-team`,
    status: byType("resolved") ? "inactive" : "active",
    name: `Response team for ${inc.site.name}`,
    managingOrganization: [ref(city)],
    participant: [
      { role: [code("owner", "Incident owner")], member: ref(officer, "Water officer") },
      ...(responder ? [{ role: [code("responder", "Responder")], member: ref(responder) }] : []),
    ],
  };

  const taskStatus = {
    awaiting_ack: "requested", escalated: "requested", acknowledged: "accepted",
    open_to_claim: "ready", in_progress: "in-progress", resolved: "completed",
  }[state.stage];

  const task: Resource = {
    resourceType: "Task",
    id: `${inc.id}-task`,
    status: taskStatus,
    businessStatus: { text: state.stage.replaceAll("_", " ") },
    intent: "order",
    priority: inc.severity === "high" ? "urgent" : "routine",
    code: code("respond", "Respond to an unsafe water incident"),
    focus: ref(issue),
    for: ref(location),
    authoredOn: inc.events[0].at,
    requester: ref(city),
    owner: responder ? ref(responder) : state.stage === "open_to_claim" ? undefined : ref(officer, "Water officer"),
    restriction: { period: { end: state.actionDue.toISOString() } },
    note: [{ text: `Acknowledge by ${state.ackDue.toISOString()}; act by ${state.actionDue.toISOString()} (${LIMITS[inc.severity].ackMin} and ${LIMITS[inc.severity].actionMin} minutes).` }],
  };

  const recipients = {
    owner: "Water officer", public_health: "Public health team", vets: "Local vet practices",
    supervisor: "Water officer's supervisor", responders: "Nearby verified responders",
  } as const;
  const sentAt = { owner: inc.events[0].at, public_health: inc.events[0].at, vets: inc.events[0].at, supervisor: state.ackDue, responders: state.actionDue };
  const message = {
    owner: "Bathing water likely unsafe. Acknowledge and act.",
    public_health: "Bathing water likely unsafe. Watch GP reports of stomach illness and skin rashes in the linked cohorts for 7 days.",
    vets: "Bathing water likely unsafe. Report dogs with vomiting or diarrhoea after swimming here.",
    supervisor: "Not acknowledged in time. Escalated to you.",
    responders: "No action in time. Open to claim by verified responders nearby.",
  };
  const communications: Resource[] = state.notified.map((who) => ({
    resourceType: "Communication",
    id: `${inc.id}-to-${who.replace("_", "-")}`,
    status: "completed",
    about: [ref(issue), ...(who === "public_health" ? groups.map((g) => ref(g)) : [])],
    sent: new Date(sentAt[who]).toISOString(),
    recipient: [{ display: recipients[who] }],
    payload: [{ contentString: `${inc.site.name}: ${message[who]}${inc.risk ? ` Risk ${(inc.risk.value * 100).toFixed(1)}%.` : ""}` }],
  }));
  if (inc.advisory) {
    communications.push({
      resourceType: "Communication",
      id: `${inc.id}-public-advisory`,
      status: "completed",
      about: [ref(issue)],
      sent: inc.events[0].at,
      recipient: [{ display: "Public" }],
      payload: [{ contentString: inc.advisory }],
    });
  }

  const resources = [city, officer, location, ...evidence, issue, ...(responder && responderRole ? [responder, responderRole] : []), careTeam, task, district, ...groups, ...communications];
  const real = new Set<Resource | undefined>([location, risk, ...labs]);
  return {
    resourceType: "Bundle",
    type: "transaction",
    timestamp: now.toISOString(),
    entry: resources.map((r) => ({
      fullUrl: `${BASE}/${r.resourceType}/${r.id}`,
      // FHIR forbids empty arrays and nulls; the replacer drops them along with undefined fields.
      resource: JSON.parse(JSON.stringify({
        ...r,
        ...(!real.has(r) && { meta: { ...(r.meta as object), security: [SYNTHETIC] } }),
        text: narrative(r),
      }, (_, v) => (Array.isArray(v) && v.length === 0) || v === null ? undefined : v)),
      request: { method: "PUT", url: `${r.resourceType}/${r.id}` },
    })),
  };
}

/** A one-line human-readable summary, which FHIR asks every resource to carry. */
function narrative(r: Resource) {
  const label = (r.name ?? (r.code as { text?: string })?.text ?? r.id) as string;
  const esc = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return { status: "generated", div: `<div xmlns="http://www.w3.org/1999/xhtml">${r.resourceType}: ${esc}</div>` };
}
