"""The film, scene by scene.

Each scene is either a motion card (`card`, drawn in cards.html) or a take of
the live site (`take`), shown inside a browser frame with a label above it.
`lines` is the narration, one breath per line, with the silence that follows
it in seconds. A scene lasts as long as its narration.

Take steps may use ("beat", n): wait until narration line n of this scene
starts, so a click lands on the sentence that describes it.
"""

# localStorage presets, so a take can start mid-story without clicking through
# everything before it. Same shape as web/lib/store.ts.
GHENT_REPORTED = '{"city":"ghent","clock":"2021-05-17T07:40:00+02:00","reported":true,"learned":false}'


def preset(state: str) -> str:
    return f"localStorage.setItem('aheadwater-demo-v2', {state!r}); true"


SCENES = [
    {"id": "intro", "card": "intro", "lines": [], "length": 5.6},
    {
        "id": "stakes", "card": "stakes",
        "lines": [
            ("Unsafe water, sanitation and hygiene cost one point four million lives in a single year, according to the World Health Organization.", 0.3),
            ("About half a million of them in India. More than thirty thousand across Europe.", 0.4),
            ("Every warning that reaches people a day earlier is a chance to keep them safe.", 0.8),
        ],
    },
    {
        "id": "open", "card": "open",
        "lines": [
            ("Every summer, millions of people swim, paddle, fish and play in their city's lakes and rivers.", 0.5),
            ("Most days, the water is fine. But it can change fast.", 0.7),
        ],
    },
    {
        "id": "challenge", "card": "challenge",
        "lines": [
            ("A storm can push sewage into a lake overnight. A heatwave can bring algae blooms and drain the oxygen. Floods and spills arrive without warning.", 0.4),
            ("A lab can confirm a problem, but the result takes a day or more to come back.", 0.4),
            ("And the water team, the health service, labs and volunteers each hear about it in a different place.", 0.8),
        ],
    },
    {
        "id": "meet", "card": "meet",
        "lines": [
            ("Meet Aheadwater: an early-warning and response system for every hazard in city water.", 0.4),
            ("It forecasts unsafe water a day ahead, brings the right people together at once, and follows every case until the water is safe again.", 0.4),
            ("Six steps, from forecast to all-clear.", 0.8),
        ],
    },
    {
        "id": "tour", "label": "aheadwater.vercel.app", "url": "/",
        "lines": [
            ("Every step opens with a tap,", 0.2),
            ("and the One Health picker shows how water, animals and people are looked after together.", 0.8),
        ],
        "take": [
            ("goto", "/", 3), ("js", "document.getElementById('how').scrollIntoView()"), ("wait", 1.5), ("rec", True), ("wait", 0.6),
            ("click", "3. Verify"), ("wait", 1.2), ("click", "4. Act"),
            ("beat", 1), ("js", "[...document.querySelectorAll('h2')].find(h => h.innerText.startsWith('Water, animals')).scrollIntoView({behavior:'smooth', block:'start'})"),
            ("wait", 1.6), ("click", "Animals"), ("wait", 1.6), ("click", "People"),
        ],
    },
    {
        "id": "model", "card": "model",
        "lines": [
            ("For bacteria, the hazard you cannot see, the forecast comes from a model trained on 150,734 bathing-water samples, from 7,246 lakes and rivers in 27 countries.", 0.4),
            ("On sites it has never seen, its alerts are right ten times more often than chance.", 0.8),
        ],
    },
    {
        "id": "predict", "label": "Step 1 · Predict", "url": "/console",
        "lines": [
            ("This is the water officer's console for Ghent, on a real morning: the seventeenth of May, 2021.", 0.3),
            ("After a wet weekend, two beaches at Blaarmeersen lake are on Watch, at five and a half times their usual risk.", 0.4),
            ("The model behind that score never saw a single Ghent sample. The lab sample taken that day came back over the limit.", 0.9),
        ],
        "take": [
            ("goto", "/console", 5), ("rec", True), ("wait", 1.5),
            ("beat", 1), ("js", "window.scrollTo({top: 360, behavior: 'smooth'})"),
            ("beat", 1, 4.0), ("js", "window.__aw.glide(window.__aw.heading('Backtest'), 120)"),
            ("wait", 2.0),
        ],
    },
    {
        "id": "detect", "label": "Step 2 · Detect", "url": "/public",
        "lines": [
            ("Anyone at the water can add what they see.", 0.3),
            ("Their photo is checked right there on the phone, for light, focus and open water, before it is sent.", 0.8),
        ],
        "take": [
            ("goto", "/public", 4), ("js", "window.__aw.warm && 0"), ("rec", True), ("wait", 0.8),
            ("js", "document.querySelector('form').scrollIntoView({behavior:'smooth', block:'center'})"), ("wait", 1),
            ("type", "textarea", "Cloudy water and a sewage smell at the east beach after the rain."),
            ("beat", 1), ("photo", "input[type=file]", "assets/blaarmeersen.jpg"), ("wait", 4.5),
            ("click", "Send report"),
        ],
    },
    {
        "id": "verify", "label": "Step 3 · Verify", "url": "/console",
        "lines": [
            ("In the console, the report joins the forecast. Two sources now agree, so the officer can confirm.", 0.3),
            ("One click opens the case. The water officer owns it, and public health and local vets hear at the same moment.", 0.8),
        ],
        "take": [
            ("goto", "/console", 2), ("js", preset(GHENT_REPORTED)), ("goto", "/console", 5), ("rec", True), ("wait", 1),
            ("js", "document.querySelector('h3:nth-of-type(1)') && window.scrollTo({top: 0})"),
            ("beat", 0, 2.5), ("click", "Confirm and open"), ("wait", 2), ("js", "window.scrollTo({top: 420, behavior: 'smooth'})"),
        ],
    },
    {
        "id": "public", "label": "The public page, live", "url": "/public",
        "lines": [
            ("The public page updates straight away: a clear advisory, and every step shown as it happens.", 0.8),
        ],
        "take": [
            ("goto", "/console", 2), ("js", preset(GHENT_REPORTED)), ("goto", "/console", 3), ("js", "window.__aw.click('Confirm and open')"),
            ("goto", "/public", 4), ("rec", True), ("wait", 1),
        ],
    },
    {
        "id": "act", "label": "Step 4 · Act", "url": "/console",
        "lines": [
            ("Every case runs on a clock. If the owner has not acknowledged it within thirty minutes, it goes to their supervisor.", 0.3),
            ("After two hours with no action, nearby verified labs, groups and volunteers can step in and take it.", 0.8),
        ],
        "take": [
            ("goto", "/console", 2), ("js", preset(GHENT_REPORTED)), ("goto", "/console", 3), ("js", "window.__aw.click('Confirm and open')"), ("wait", 3),
            ("js", "window.scrollTo({top: 380})"), ("rec", True), ("wait", 1.5),
            ("click", "+1 h"), ("wait", 2.5), ("js", "window.scrollTo({top: 380, behavior: 'smooth'})"),
            ("beat", 1), ("click", "+1 h"), ("wait", 1), ("js", "window.scrollTo({top: 380, behavior: 'smooth'})"),
        ],
    },
    {
        "id": "respond", "label": "Responder view", "url": "/responder",
        "lines": [
            ("Here, the volunteer wardens, four hundred metres away, claim the case and attach the lab result: over the limit, as forecast.", 0.8),
        ],
        "take": [
            ("goto", "/console", 2), ("js", preset(GHENT_REPORTED)), ("goto", "/console", 3), ("js", "window.__aw.click('Confirm and open')"), ("wait", 3),
            ("js", "window.__aw.click('+1 h')"), ("wait", 1), ("js", "window.__aw.click('+1 h')"), ("wait", 1),
            ("goto", "/responder", 4), ("rec", True), ("wait", 1), ("click", "Claim this incident"), ("wait", 2), ("click", "Upload the lab result"),
        ],
    },
    {
        "id": "health", "label": "One Health", "url": "/health",
        "lines": [
            ("This is One Health at work. Public health sees which neighbourhoods live near the water, by age group, in the OneAquaHealth cohort standard.", 0.3),
            ("The same query runs live on real Oslo cohorts in the OneAquaHealth sandbox.", 0.8),
        ],
        "take": [("goto", "/health", 6), ("rec", True), ("wait", 1.5), ("beat", 1), ("js", "window.scrollTo({top: 520, behavior: 'smooth'})")],
    },
    {
        "id": "resolve", "label": "Steps 5 & 6 · Resolve and learn", "url": "/console",
        "lines": [
            ("When the follow-up sample comes back clean, the case closes and the public page shows the all-clear.", 0.3),
            ("The closed case becomes a new labelled example, so the forecast keeps getting sharper.", 0.8),
        ],
        "take": [
            ("goto", "/console", 2), ("js", preset(GHENT_REPORTED)), ("goto", "/console", 3), ("js", "window.__aw.click('Confirm and open')"), ("wait", 3),
            ("js", "window.__aw.click('Dispatch')"), ("wait", 1), ("js", "window.__aw.click('The lab result')"), ("wait", 2),
            ("js", "window.scrollTo({top: 700})"), ("rec", True), ("wait", 1),
            ("click", "Close with"), ("wait", 2), ("beat", 1), ("click", "Add the closed incident"), ("wait", 1),
        ],
    },
    {
        "id": "hazards", "label": "Every hazard, every day", "url": "/console",
        "lines": [
            ("Bacteria is one hazard. Algae blooms, low oxygen and sewer overflows run as rules on the forecast, in any city, from day one.", 0.8),
        ],
        "take": [("goto", "/console", 6), ("js", "document.querySelector('h2') && 0"), ("rec", True), ("wait", 0.5),
                 ("js", "[...document.querySelectorAll('h2')].find(h => h.innerText.startsWith('Other hazards')).scrollIntoView({behavior:'smooth', block:'center'})")],
    },
    {
        "id": "bengaluru", "label": "Bengaluru, August 2017", "url": "/public",
        "lines": [
            ("The same code runs in Bengaluru. On the fifteenth of August 2017, NDTV reported the city's heaviest August rain in a hundred and twenty-seven years.", 0.3),
            ("The next morning, foam from Varthur Lake spilled onto the road. A report and official monitoring open the case, and the same workflow carries it through.", 0.3),
            ("Prediction switches on there as local samples come in.", 0.8),
        ],
        "take": [
            ("goto", "/console", 3), ("rec", True), ("wait", 0.5),
            ("js", "document.querySelector('select').value='bengaluru'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true})); true"),
            ("wait", 2.5), ("beat", 1), ("click", "Deliver the citizen report"), ("wait", 1), ("click", "Confirm and open"), ("wait", 2),
            ("goto", "/public", 3),
        ],
    },
    {
        "id": "fhir", "label": "Built on HL7 FHIR", "url": "/fhir-explorer",
        "lines": [
            ("Every step is stored as HL7 FHIR, on the OneAquaHealth standard, so hospitals, labs and city systems can read a case directly.", 0.3),
            ("The official HL7 validator reports zero errors.", 0.8),
        ],
        "take": [("goto", "/fhir-explorer", 4), ("rec", True), ("wait", 1.5), ("click", "DetectedIssue"), ("wait", 2), ("click", "Task"), ("wait", 2)],
    },
    {
        "id": "future", "card": "future",
        "lines": [
            ("Live sensors and city lab feeds flowing straight in, a trained forecast for every hazard as local data grows, and the incident and citizen-report profiles offered back to the OneAquaHealth standard.", 0.3),
            ("Then the next city, and the next. Every lake and river people love, watched a day ahead.", 0.9),
        ],
    },
    {
        "id": "close", "card": "close",
        "lines": [
            ("Aheadwater. Know before the water turns.", 0.5),
            ("Safe city water, a day ahead, for every city that wants it.", 2.0),
        ],
    },
]
