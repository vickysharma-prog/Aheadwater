// Writes the full Ghent scenario as a Bundle and checks it with the HL7 validator
// against the OneAquaHealth profiles. Needs Java, fhir/validator_cli.jar and the
// SUSHI output in fhir/oah (see fhir/README.md).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

import { fullScenario } from "../lib/fhir.test.ts";

const fhir = new URL("../../fhir/", import.meta.url);
mkdirSync(new URL("out/", fhir), { recursive: true });
const out = new URL("out/ghent-incident.json", fhir);
writeFileSync(out, JSON.stringify(fullScenario().bundle, null, 2));

execFileSync("java", [
  "-jar", new URL("validator_cli.jar", fhir).pathname.slice(process.platform === "win32" ? 1 : 0),
  out.pathname.slice(process.platform === "win32" ? 1 : 0),
  "-version", "4.0.1",
  "-ig", new URL("oah/fsh-generated/resources", fhir).pathname.slice(process.platform === "win32" ? 1 : 0),
  "-output", new URL("out/validation.json", fhir).pathname.slice(process.platform === "win32" ? 1 : 0),
], { stdio: "inherit" });
