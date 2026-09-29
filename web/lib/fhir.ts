// Turns an incident into a FHIR R4 transaction Bundle.
// Location and Observation follow the OneAquaHealth profiles; the rest is base R4.
import { incidentState, LIMITS } from "./incident.ts";
import type { Incident } from "./scenario.ts";

const OAH = "http://hl7.eu/fhir/ig/oah/StructureDefinition";
export const BASE = "https://aheadwater.vercel.app/fhir";
export const CODES = `${BASE}/CodeSystem/aheadwater`;
const UCUM = "http://unitsofmeasure.org";

type Resource = { resourceType: string; id: string; [k: string]: unknown };

/** FHIR ids allow letters, digits, "-" and "." only. */
export const fhirId = (s: string) => s.toLowerCase().replace(/[^a-z0-9.-]/g, "-").slice(0, 64);

const ref = (r: Resource, display?: string) => ({ reference: `${r.resourceType}/${r.id}`, ...(display && { display }) });
const code = (c: string, display: string) => ({ coding: [{ system: CODES, code: c, display }], text: display });
const category = (c: string) => [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: c }] }];

export function incidentBundle(inc: Incident, now: Date) {
  const state = incidentState(inc.severity, inc.events, now);
  const city: Resource = { resourceType: "Organization", id: "ghent-water", name: "City of Ghent, water and environment" };
  const officer: Resource = {
    resourceType: "PractitionerRole",
    id: "ghent-water-officer",
    organization: ref(city),
    code: [{ text: "Water officer, incident owner" }],
  };

  const location: Resource = {
    resourceType: "Location",
    id: fhirId(inc.site.id),
    meta: { profile: [`${OAH}/location-oah`] },
    identifier: [{ system: "https://www.eea.europa.eu/bathing-water-id", value: inc.site.id }],
    name: inc.site.name,
    mode: "instance",
    type: [{ text: inc.site.zone === "riverBathingWater" ? "River bathing water" : "Lake bathing water" }],
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

  const risk = obs(`${inc.id}-risk`, {
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

  const labs = inc.lab.flatMap((l) => [
    obs(`${inc.id}-lab-${l.date}-ecoli`, {
      category: category("laboratory"),
      code: code("escherichia-coli", "Escherichia coli in bathing water"),
      effectiveDateTime: l.date,
      performer: [ref(city)],
      valueQuantity: { value: l.ecoli, unit: "cfu/100 mL", system: UCUM, code: "[CFU]/(100.mL)" },
      referenceRange: [{ high: { value: 1000, unit: "cfu/100 mL", system: UCUM, code: "[CFU]/(100.mL)" } }],
    }),
    obs(`${inc.id}-lab-${l.date}-ie`, {
      category: category("laboratory"),
      code: code("intestinal-enterococci", "Intestinal enterococci in bathing water"),
      effectiveDateTime: l.date,
      performer: [ref(city)],
      valueQuantity: { value: l.ie, unit: "cfu/100 mL", system: UCUM, code: "[CFU]/(100.mL)" },
      referenceRange: [{ high: { value: 400, unit: "cfu/100 mL", system: UCUM, code: "[CFU]/(100.mL)" } }],
    }),
  ]);

  const evidence = [risk, citizen, ...labs].filter(Boolean) as Resource[];
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
    owner: "Water officer", supervisor: "Water officer's supervisor",
    public_health: "Public health team", responders: "Nearby verified responders",
  } as const;
  const sentAt = { owner: inc.events[0].at, supervisor: state.ackDue, public_health: state.ackDue, responders: state.actionDue };
  const communications: Resource[] = state.notified.map((who) => ({
    resourceType: "Communication",
    id: `${inc.id}-to-${who.replace("_", "-")}`,
    status: "completed",
    about: [ref(issue)],
    sent: new Date(sentAt[who]).toISOString(),
    recipient: [{ display: recipients[who] }],
    payload: [{ contentString: `${inc.site.name}: bathing water likely unsafe. Risk ${(inc.risk.value * 100).toFixed(1)}%.` }],
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

  const resources = [city, officer, location, ...evidence, issue, ...(responder && responderRole ? [responder, responderRole] : []), careTeam, task, ...communications];
  return {
    resourceType: "Bundle",
    type: "transaction",
    timestamp: now.toISOString(),
    entry: resources.map((r) => ({
      fullUrl: `${BASE}/${r.resourceType}/${r.id}`,
      resource: JSON.parse(JSON.stringify({ ...r, text: narrative(r) })), // stringify drops undefined fields
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
