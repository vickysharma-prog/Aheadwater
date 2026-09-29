# FHIR validation

The incident Bundle is checked against the OneAquaHealth implementation guide
with the official HL7 validator.

```sh
cd fhir
git clone --depth 1 https://github.com/hl7-eu/oah
cd oah && npx fsh-sushi . && cd ..        # builds the OAH profiles
curl -L -o validator_cli.jar https://github.com/hapifhir/org.hl7.fhir.core/releases/latest/download/validator_cli.jar
cd ../web && npm run validate-fhir        # needs Java 17 or later
```

Two Bundles are checked: `out/ghent-incident.json` (the incident played
through to the end) and `out/ghent-incident-open.json` (two and a half hours in,
nobody has acted, open to claim). `out/validation.json` is the validator's
report. On 29 Sep 2026: 0 errors, 30 warnings, of three kinds:

- Our own code system is not published where the validator can reach it. It
  is served at `/fhir/CodeSystem/aheadwater`.
- The cohort's "Living place" code (SNOMED 20733006) is outside the OAH cohort
  value set. The binding is extensible, and the OAH guide's own Oslo examples
  use the same code.
- The lake's `Location.type` carries text rather than a code.

The script exits with an error if the validator reports any error.
