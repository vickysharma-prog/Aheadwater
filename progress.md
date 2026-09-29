# Progress log

One entry per working session, newest at the top. Date, what got done, what
broke, what is next.

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
