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

`out/ghent-incident.json` is the Bundle that was checked and
`out/validation.json` is the validator's report. On 29 Sep 2026: 0 errors.
The warnings say our own code system is not published anywhere the validator
can reach (it is served at `/fhir/CodeSystem/aheadwater`) and that the lake's
`Location.type` carries text rather than a code.
