// Writes the full Ghent scenario as a Bundle and checks it with the HL7 validator
// against the OneAquaHealth profiles. Needs Java, fhir/validator_cli.jar and the
// SUSHI output in fhir/oah (see fhir/README.md).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath as path } from "node:url";

import { incidentBundle } from "../lib/fhir.ts";
import { CITIES, RESOLVED_AT, resolvedIncident, newIncident } from "../lib/scenario.ts";

const fhir = new URL("../../fhir/", import.meta.url);
mkdirSync(new URL("out/", fhir), { recursive: true });
const out = new URL("out/ghent-incident.json", fhir);
writeFileSync(out, JSON.stringify(incidentBundle(resolvedIncident(), RESOLVED_AT), null, 2));
const blr = new URL("out/bengaluru-incident.json", fhir);
writeFileSync(blr, JSON.stringify(incidentBundle(resolvedIncident(CITIES.bengaluru), new Date("2017-08-23T00:00:00Z")), null, 2));
// Also mid-incident: nobody acted, so it is open to claim and has no owner.
const open = new URL("out/ghent-incident-open.json", fhir);
writeFileSync(open, JSON.stringify(incidentBundle(newIncident(CITIES.ghent, "2021-05-17T08:05:00+02:00"), new Date("2021-05-17T10:30:00+02:00")), null, 2));

execFileSync("java", [
  "-jar", path(new URL("validator_cli.jar", fhir)),
  path(out),
  path(open),
  path(blr),
  "-version", "4.0.1",
  "-ig", path(new URL("oah/fsh-generated/resources", fhir)),
  "-output", path(new URL("out/validation.json", fhir)),
], { stdio: "inherit" });

// Keep a summary next to the app, for the FHIR page.
const outcome = JSON.parse(readFileSync(new URL("out/validation.json", fhir), "utf8"));
// One file gives an OperationOutcome; several give a Bundle of them.
const issues: { severity: string }[] = outcome.issue ?? outcome.entry.flatMap((e: { resource: { issue: unknown[] } }) => e.resource.issue);
const count = (s: string) => issues.filter((i) => i.severity === s).length;
writeFileSync(new URL("../data/validation.json", import.meta.url), JSON.stringify({
  validator: "HL7 FHIR validator (validator_cli.jar)",
  profiles: "hl7.eu.fhir.oah, built from github.com/hl7-eu/oah with SUSHI",
  date: new Date().toISOString().slice(0, 10),
  bundles: ["Ghent, resolved", "Ghent, open to claim with no owner", "Bengaluru, closed"],
  errors: count("error") + count("fatal"),
  warnings: count("warning"),
}, null, 2));

if (count("error") + count("fatal") > 0) process.exit(1);
