// Writes the full Ghent scenario as a Bundle and checks it with the HL7 validator
// against the OneAquaHealth profiles. Needs Java, fhir/validator_cli.jar and the
// SUSHI output in fhir/oah (see fhir/README.md).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath as path } from "node:url";

import { fullScenario } from "../lib/fhir.test.ts";

const fhir = new URL("../../fhir/", import.meta.url);
mkdirSync(new URL("out/", fhir), { recursive: true });
const out = new URL("out/ghent-incident.json", fhir);
writeFileSync(out, JSON.stringify(fullScenario().bundle, null, 2));

execFileSync("java", [
  "-jar", path(new URL("validator_cli.jar", fhir)),
  path(out),
  "-version", "4.0.1",
  "-ig", path(new URL("oah/fsh-generated/resources", fhir)),
  "-output", path(new URL("out/validation.json", fhir)),
], { stdio: "inherit" });

// Keep a summary next to the app, for the FHIR page.
const outcome = JSON.parse(readFileSync(new URL("out/validation.json", fhir), "utf8"));
const issues: { severity: string }[] = outcome.issue ?? [];
const count = (s: string) => issues.filter((i) => i.severity === s).length;
writeFileSync(new URL("../data/validation.json", import.meta.url), JSON.stringify({
  validator: "HL7 FHIR validator (validator_cli.jar)",
  profiles: "hl7.eu.fhir.oah, built from github.com/hl7-eu/oah with SUSHI",
  date: new Date().toISOString().slice(0, 10),
  errors: count("error") + count("fatal"),
  warnings: count("warning"),
}, null, 2));
