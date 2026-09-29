# Aheadwater: project brief

What we are building and why. Where things stand is in `state.md`. The dated
log is in `progress.md`.

## One line

Aheadwater warns a city before its river turns unsafe, then runs the response
until the problem is fixed, and learns from every case.

## The problem

Urban rivers and lakes turn unsafe fast. A heavy storm pushes sewage into the
water through overflow points, and bacteria counts climb within a day or two.
People swim, paddle and fish, and dogs go in, because nobody has told them.
Today the city usually finds out from a lab sample taken days later.

When a problem is found, the response is scattered. The environment officer,
the public health team, labs, NGOs and volunteers each hear about it
separately, if at all. Nobody can see who is handling it or whether anything
happened. Health data and river data sit in separate systems, so nobody can
ask whether people near the river got sick after it went bad.

## What Aheadwater does

Six stages, each stored as a standard HL7 FHIR resource:

| Stage | What happens |
|---|---|
| **Predict** | A model trained on bacteria samples from bathing sites across Europe, plus the weather before each sample, gives each site a risk score for the next 48 hours |
| **Detect** | Risk crosses the alert level, a lab result breaks a limit, a rule fires (algae, low oxygen, flood), or a citizen sends a report with a photo |
| **Verify** | Each alert gets a trust score from how many sources agree. The officer confirms before anything goes public |
| **Mobilise** | The city officer owns the incident. The system suggests nearby verified responders (labs, NGOs, trained volunteers) by distance and skill. They accept or decline |
| **Resolve** | The responder closes the incident with evidence. The public page shows each step |
| **Learn** | Every closed incident becomes a labelled example for the next training run |

### One Health link

A confirmed incident checks the health cohort data for that district, notifies
public health and vets, and publishes a plain advisory ("avoid contact, keep
dogs out of the water").

### Escalation ladder

| Time since alert | What happens |
|---|---|
| 0 | The owner (city water or environment officer) is notified and must acknowledge |
| High 30 min, medium 4 h, no acknowledgement | Escalates to their supervisor and the public health officer |
| High 2 h, medium 24 h, no action | Open to claim by nearby verified responders |
| Always | The public page shows status, advisory and the update timeline |

Anyone can see an incident. Only verified responders can claim one. The public
page shows no names and no internal notes.

## Settled decisions

Settled on 29 Sep 2026. Change one only by writing the new decision here with
its date and reason.

1. **Track.** Digital Health Standards first; Data-to-Insight and AI-Supported
   Assessment second.
2. **Place.** Built and demonstrated on Ghent, a OneAquaHealth pilot city, with
   real data. The video spends about 30 seconds on an Indian lake to show the
   platform runs elsewhere unchanged; the model recalibrates on local samples.
3. **Why Ghent.** It has the most bacteria samples of the pilot cities (429 at
   five lake sites, 2020 to 2024) and Flanders publishes its sewer overflow
   points. Oslo and Benevento have no samples in the EEA data.
4. **Bacteria model.** Trained on EEA WISE_BWD individual sample results (about
   681,000 rows, 2020 to 2024, all of Europe), with weather from the Open-Meteo
   archive for the days before each sample. Features use only data from before
   the sample date. Cross-validation is grouped by site. We report PR-AUC and
   recall at the alert threshold.
5. **Alert label.** A sample counts as unsafe when E. coli exceeds 1000 cfu/100
   ml or intestinal enterococci exceed 400 cfu/100 ml, the "good quality"
   values for inland waters in Annex I of Directive 2006/7/EC.
6. **Scope of the model.** Tuned for recreational contact during the bathing
   season, which is when the samples are taken.
7. **Other hazards.** Algae bloom, low oxygen and flash flood run as rules on
   weather and water readings. The EEA publishes no cyanobacteria table to
   train on.
8. **Backtest.** The demo replays a real past exceedance at a Ghent site and
   shows how early the model would have warned. Observed rain stands in for the
   forecast.
9. **FHIR.** Built on the OneAquaHealth implementation guide `hl7.eu.fhir.oah`
   (github.com/hl7-eu/oah). Incidents use `DetectedIssue`, `Task`, `CareTeam`,
   `Communication` and `Observation`. We read from the OneAquaHealth sandbox and
   write only to our own server.
10. **Health data.** Ghent has no cohort in the sandbox, so Ghent uses a
    synthetic cohort, labelled as synthetic, built on the OAH `Group` profile.
    The same query runs against the real Oslo cohorts in the sandbox.
11. **Stack.** Next.js on Vercel for the app. Python for data and training only;
    the trained model is exported and scored inside the Next.js server. HAPI
    FHIR on an always-on host, with cached bundles if it is slow to answer.
12. **Screens.** Officer console, responder view, public page with a citizen
    report form. Every incident has a "download as FHIR" button for
    researchers.

## Rules we have to meet

- Deadline 4 Oct 2026, 9:00pm PDT.
- Demo video 3 to 5 minutes, public repo with source and docs, working
  prototype.
- HL7 FHIR is required.
- Built within the hackathon period (16 Sep to 5 Oct 2026). This repo started
  on 29 Sep 2026.
- Judging: impact and mission 30%, innovation 20%, technical 20%, usability
  15%, feasibility and scale 15%.

## Data sources

| Source | What we use | Access |
|---|---|---|
| EEA DiscoData, `WISE_BWD.latest.assessment_MonitoringResult` | Bacteria samples per site and date | SQL over HTTPS, no key |
| EEA DiscoData, `WISE_BWD.latest.spatial_ProtectedArea` | Site coordinates and type (lake, river) | Same |
| Open-Meteo archive API | Daily rain and temperature per location | HTTPS, no key |
| OneAquaHealth FHIR sandbox, `sandbox.hl7europe.eu/oneaquahealth/fhir/` | Health cohorts (Oslo, Benevento), water observations | FHIR R4, read only for us |
| Flanders VMM sewer overflow network | Overflow points near Ghent | WFS |
