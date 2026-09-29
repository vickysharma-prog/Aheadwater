# Progress log

One entry per working session, newest at the top. Date, what got done, what
broke, what is next.

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
