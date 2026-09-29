# Progress log

One entry per working session, newest at the top. Date, what got done, what
broke, what is next.

## 2026-09-29 (late night): Hazard rules and the photo check

Two things from the plan were still missing, and Vicky asked for both. The
other hazards now run as rules on the forecast: algae blooms, low oxygen and
sewer overflow, each with thresholds a city can tune. They need no local
samples, so they work in Bengaluru too. Citizen photos are checked in the
reporter's browser for light and focus, and MobileNet looks for open water.

The blur limit was first set by guesswork at 40. Measured on a real
Blaarmeersen photo, a clearly blurred copy scored 27 and a slightly soft one
265, so the limit went to 100. In Chrome, the real photo passed and the blurred
copy was turned back. Learn stays a record of the next training row; it does
not retrain live, and the docs say so.

What broke: the internet dropped mid-session; nothing was lost, the photo work
was on disk and went into the next commit.

## 2026-09-29 (night): Live risk, One Health in FHIR, Bengaluru

The console shows today's risk for Ghent from the Open-Meteo forecast.

A review of the FHIR data found the One Health link missing: public health was
only told on escalation, vets never, and the cohorts on the health page did not
exist as resources. Now public health and vets hear when a case opens, the
three district cohorts are `Group`s on the OAH profile, and demo actors carry
the HL7 test-data tag. Validating a mid-incident Bundle as well as the finished
one caught an empty `mitigation` array, which FHIR forbids.

Bengaluru first went in as a made-up scenario. Vicky pushed for a real event,
as with Ghent, and he was right. It now replays the Varthur Lake froth of
16 August 2017, after record rain, with CPCB's 2017 monitoring as the lab
evidence. CPCB publishes a yearly range, not dated samples, so the app shows
it as a range over the year and says so. The other lakes carry a standing
warning from the same data instead of "No warning".

What broke: Docker does not run on this laptop, so the local HAPI server check
is dropped; the HL7 validator is the conformance check.

Next: the video.

## 2026-09-29 (later): Model, FHIR and the app, live

Trained the bacteria model on 150,734 samples. On sites it never saw, one
alert in five is a real exceedance, against one in fifty by chance. The Ghent
check was sobering: of four real exceedances there, only one followed rain.
The model ranked that one 7th of 314 samples; the other three happened in dry
weather and no weather model could have seen them. That shaped the product:
the model is one of several ways a case opens, next to lab results and
citizen reports, and it says so.

What broke: reading the weather grid one point at a time took over ten
minutes; reading the region once into memory takes seconds. The HL7 validator
found 15 errors in the first Bundle (a wrong SNOMED code, and an Organization
where FHIR wants a PractitionerRole as author). Fixed; now 0 errors.

Dropped the hosted HAPI server: it is a Java server, it cannot run on Vercel,
and free hosts put it to sleep. The app serves its own read-only FHIR endpoint
instead, and the validator is what proves the resources conform.

Next: click through the whole flow on the live site, add today's live risk,
and plan the video.

## 2026-09-29: Idea settled, data in

Settled the idea after a long round of questions: a city's response system for
urban rivers, from warning to fix, built on the OneAquaHealth FHIR guide. The
full list of decisions is in `project.md`.

Pulled the data. The EEA publishes every bacteria sample from every bathing
site in Europe; the inland ones come to 185,562 samples at 10,765 lake and
river sites. Ghent has the most of the five pilot cities, so it is the demo
city.

What broke: the EEA SQL endpoint refuses `ORDER BY`, so pages come back in no
fixed order. The fix is to fetch one country at a time and drop duplicates.
The plan to get historical weather from Open-Meteo also fell over: its free
tier counts five years of data for one place as dozens of calls, and we need
thousands of places. E-OBS, the European gridded weather record, comes as two
files with no limit.

Next: join samples to the weather before each one, and train.
