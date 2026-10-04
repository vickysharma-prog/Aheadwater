# Progress log

One entry per working session, newest at the top. Date, what got done, what
broke, what is next.

## 2026-10-04: How it works and accessibility pages

Two pages were missing: a full walkthrough and an accessibility page. `/how-it-works` explains the six steps, the escalation clock, the forecast results, the weather rules, the FHIR records and what the demo replays; every number on it is read from the same files the app uses. `/accessibility` lists what the site does for everyone. Both are linked from the landing page and from a new footer on every page.

To make the accessibility page true, the site now respects the device's reduce-motion setting everywhere (Motion animations, Lenis scrolling, the auto walkthrough, the hero video), the hero video has a pause button, and every page has a skip link and a visible keyboard outline. Nothing changes for anyone who has not asked for less motion.

## 2026-10-03: The demo video

Built the demo film from the live site: a logo intro, what unsafe water costs
(WHO: 1.4 million deaths a year worldwide, about 498,000 in India, about 33,000
in Europe, 2019), the challenge, the six steps, the model, then every screen
of the app in use, Bengaluru, FHIR, what comes next, and a close. 4:54.

What broke: this laptop's Chrome sends three or four frames a second, so every
take runs the page ten times slower and the frames are re-timed. Then a run of
smaller things: background jobs hit a time limit, Chrome children kept the
port, still pages sent no frames, a snapshot arrived out of order, and a 25
fps background still made each take shorter than its slot, which left black
behind the cross-fades. All fixed in `video/`. Recording it also caught a real
bug: the warning card on the public page was invisible. Fixed on the site.

## 2026-10-02 (later): Motion on every page

Every page fades in on arrival. The console's steps enter in turn, the step
waiting for the officer glows, a finished step's tick springs in, the stage
badge cross-fades, and markers that need attention pulse on the map. The public
page's site cards stagger in, a site under warning pulses, each reached step
pops, and a sent report gets an animated tick. The responder card slides in
and the claim button pulses while a case is open to claim. Health cohorts and
the FHIR resource list stagger in, and the FHIR JSON cross-fades on switch.
Spacing on the landing page was tightened so it reads as one piece.

## 2026-10-02: A landing page that sells the idea

Vicky found the landing page flat: no motion, nothing to click, and a headline
that did not land. Rebuilt it with Motion and Lenis: a full-screen ocean video
behind a glass header with centred tabs, the headline "Stop water crises before
they start." with a one-line description of the product under it, counters,
an auto-playing six-step walkthrough you can click, a chart that draws itself,
a tap-through One Health picker, and city cards that open the replay. All
copy is positive and plain.

What broke: the first video encode (720p, heavy compression) looked soft. A
1080p encode cut to 10 seconds is sharp at 7.9 MB.

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
