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
| **Predict** | A model trained on bacteria samples from bathing sites across Europe, plus the weather before each sample, gives each site a risk score for the next day |
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
| 0 | The owner (city water or environment officer) is notified and must acknowledge. Public health and local vets are told at the same time (One Health) |
| High 30 min, medium 4 h, no acknowledgement | Escalates to the owner's supervisor |
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
   ml or intestinal enterococci exceed 400 cfu/100 ml. Annex I of Directive
   2006/7/EC uses these values for inland waters to classify a site as "good"
   on the 95th percentile of four seasons of samples; we apply them to single
   samples as the alert level.
6. **Scope of the model.** Tuned for recreational contact during the bathing
   season, which is when the samples are taken.
7. **Other hazards.** Algae bloom, low oxygen and flash flood run as rules on
   the weather (`web/lib/hazards.ts`). The EEA publishes no cyanobacteria table
   to train on. Defaults: algae watch at a 7-day mean of 20 °C with 3-day mean
   wind under 10 km/h, alert at 23 °C (warm, calm weather, per WHO's Toxic
   Cyanobacteria in Water, 2021); low oxygen watch after three days at 28 °C or
   more, or heavy rain (20 mm) after seven dry days, alert when both; sewer
   overflow watch at 20 mm in a day, alert at 40 mm. Each city tunes its own.
   The rules need no local samples, so they run in Bengaluru too.
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
    the trained model is exported and scored inside the Next.js server.
    *Revised 29 Sep:* no hosted HAPI server. HAPI is a Java server, it cannot
    run on Vercel, and free hosts put it to sleep, so a judge's first click
    would hang. The app serves its own FHIR endpoint (`/fhir/metadata`, read by
    id, a few searches, one transaction Bundle per incident). A test validates
    every resource against the OAH profiles with the HL7 validator, and a script
    posts the Bundle to a local HAPI server to show a real FHIR server accepts
    it.
12. **Screens.** Officer console, responder view, public page with a citizen
    report form. Every incident has a "download as FHIR" button for
    researchers.
13. **Two alert levels (29 Sep).** *Alert*: risk of 0.10 or more, the level at
    which one alert in five is a real exceedance across Europe. It opens an
    incident and starts the escalation clock. *Watch*: risk at least five times
    the site's usual level. It highlights the site on the map for the officer
    and escalates nothing. Tested across Europe, a rule relative to each site
    alone gave more false alarms than the fixed level, so it only drives Watch.
14. **No shared database for the demo (29 Sep).** Each visitor runs the Ghent
    scenario in their own browser, with a reset button, so two judges never
    see each other's half-finished incident. The incident state comes from the
    event log and the demo clock (`web/lib/incident.ts`).
15. **Which resources use OAH profiles.** Location, Observation (indicators and
    health measures) and Group follow the OAH profiles. DetectedIssue, Task,
    CareTeam and Communication are base FHIR R4, because the OAH guide does not
    profile them. DetectedIssue is FHIR's resource for "a problem found that
    needs action", which is what an unsafe river is.

16. **Health is told at once (29 Sep).** Public health and vets hear when the
    incident opens, not when it escalates. The escalation ladder is about who
    must act on the water; the health warning cannot wait for it. The public
    health message points at the cohort `Group`s for the district.
17. **Synthetic data is tagged in FHIR (29 Sep).** Demo actors and the
    simulated workflow carry `meta.security` HTEST ("test health data"). The
    site, the risk score and the lab results are real and carry no tag.
18. **India in the video (29 Sep).** Bengaluru is a second demo city on the
    same code, replaying a real event: record rain on 15 Aug 2017 (180 mm
    between 3 and 6 am, reported by NDTV) and froth from Varthur Lake over
    Whitefield road on 16 Aug; the National Green Tribunal heard the case on
    17 Aug and summoned officials for 22 Aug. The evidence known on the morning is
    CPCB's 2016 monitoring for Varthur (faecal coliform 79,000 to 7,000,000
    MPN/100 ml, against the bathing limit of 2,500 in Schedule I item 93 of the
    Environment (Protection) Rules); with the citizen report that makes two
    sources, the rule every city follows. CPCB's 2017 range (79,000 to
    3,480,000) was published after the year and is attached at close, labelled
    so. CPCB gives yearly ranges, not dated samples, and the app says so. A
    yearly range is not a training row. Agara Lake is left out: CPCB's
    "Agaram Lake" (station 3612) could not be confirmed as the same lake. No risk number there: the model learned
    European latitudes and seasons and would recalibrate on local samples
    first.

19. **Citizen photo check (29 Sep).** Runs in the reporter's browser; the
    photo never leaves it. Light and focus are measured (mean brightness,
    variance of the Laplacian at 256 px wide; limits set on a real
    Blaarmeersen photo and blurred copies). A photo that fails is not attached,
    and the reporter is asked for another. MobileNet v2 (ImageNet) looks for
    open water in frame; that is a hint, not a gate, since close-ups of foam or
    murky water may not match any ImageNet label. A checked photo adds 0.1 to
    the trust score.
20. **Learn is a record, not a live retrain (29 Sep).** A closed case with a
    dated lab sample is shown as the next training row. Retraining runs
    offline with `ml/train.py`.

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
