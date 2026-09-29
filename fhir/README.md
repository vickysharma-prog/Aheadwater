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

Three Bundles are checked: `out/ghent-incident.json` (Ghent, played through
to the end), `out/ghent-incident-open.json` (Ghent two and a half hours in,
nobody has acted, open to claim) and `out/bengaluru-incident.json` (the
Varthur Lake case, closed). `out/validation.json` is the validator's report.
On 29 Sep 2026: 0 errors, 43 warnings, of these kinds:

- Our own code system is not published where the validator can reach it. It
  is served at `/fhir/CodeSystem/aheadwater`.
- The cohort's "Living place" code (SNOMED 20733006) is outside the OAH cohort
  value set. The binding is extensible, and the OAH guide's own Oslo examples
  use the same code.
- A lake's `Location.type` carries text rather than a code.
- The UCUM unit `{MPN}/(100.mL)` uses an annotation, which is how MPN counts
  are written in UCUM.
- The CPCB min-max observation uses our code rather than one from the OAH
  component value set.

The script exits with an error if the validator reports any error.
