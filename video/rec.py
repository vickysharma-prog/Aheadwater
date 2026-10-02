"""Film the live site in headless Chrome.

Frames come straight off Chrome's compositor (so the ocean video and the
animations really move) and go to disk as they arrive, each with the moment it
arrived. `encode` turns them into a constant 30 fps clip that keeps real time.

A take is a list of steps run in order:

    ("goto", "/console")         open a page and wait for it to settle
    ("rec", True | False)        start or stop keeping frames
    ("wait", 2.5)                let time pass (frames keep coming)
    ("click", "Deliver the")     move the drawn cursor to the first button or
                                 link whose text starts with this, then click
    ("js", "...")                run JavaScript in the page
    ("scroll", 600)              scroll smoothly by this many pixels
    ("beat", n[, extra])         wait until narration line n starts (+ extra s)
    ("type", selector, text)     type into a field, a letter at a time
    ("photo", selector, path)    attach a local image to a file input

A drawn cursor glides to whatever is clicked, so the film reads as a person
using the app.

This laptop's Chrome sends only three or four frames a second, so a take runs
in slow motion: every clock the page can see (timers, animation frames, CSS
and Web animations, video) runs at SLOW times real speed, and the frames are
stamped in page time. Ten times slower gives thirty-plus frames a second of
page time, at the cost of a take lasting ten times as long.
"""

import base64
import json
import mimetypes
import pathlib
import shutil
import socket
import subprocess
import time
import urllib.request

import websocket

HERE = pathlib.Path(__file__).resolve().parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SITE = "https://aheadwater.vercel.app"
PORT = 9333
FPS = 30
SLOW = 0.1

TIME_JS = r"""
(() => {
  const S = %s;
  const rn = performance.now.bind(performance), t0 = rn(), d0 = Date.now(), RealDate = Date;
  const now = () => t0 + (rn() - t0) * S;
  performance.now = now;
  class D extends RealDate { constructor(...a) { a.length ? super(...a) : super(d0 + (rn() - t0) * S); } static now() { return d0 + (rn() - t0) * S; } }
  window.Date = D;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf(() => cb(now()));
  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
  window.setTimeout = (f, ms, ...a) => st(f, (ms || 0) / S, ...a);
  window.setInterval = (f, ms, ...a) => si(f, (ms || 0) / S, ...a);
  const slowVideos = () => document.querySelectorAll('video').forEach(v => { v.playbackRate = Math.max(S, 0.0625); v.defaultPlaybackRate = v.playbackRate; });
  new MutationObserver(slowVideos).observe(document, { childList: true, subtree: true });
  document.addEventListener('playing', slowVideos, true);
})();
"""

CURSOR_JS = r"""
(() => {
  if (window.__aw) return;
  const c = document.createElement('div');
  c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#0f172a" stroke="white" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  Object.assign(c.style, {position:'fixed', left:'-40px', top:'-40px', zIndex:2147483647, pointerEvents:'none',
    transition:'left .9s cubic-bezier(.3,.7,.2,1), top .9s cubic-bezier(.3,.7,.2,1), transform .15s', filter:'drop-shadow(0 2px 4px rgba(0,0,0,.35))'});
  const ring = document.createElement('div');
  Object.assign(ring.style, {position:'fixed', width:'44px', height:'44px', marginLeft:'-22px', marginTop:'-22px', borderRadius:'50%',
    border:'3px solid #0e6f86', opacity:0, zIndex:2147483646, pointerEvents:'none', transition:'opacity .5s, transform .5s', transform:'scale(.4)'});
  const add = () => { document.body.append(c, ring); };
  document.body ? add() : addEventListener('DOMContentLoaded', add);
  window.__aw = {
    find(text) {
      const els = [...document.querySelectorAll('button, a, select, [role=button], input[type=file]')];
      return els.find(e => (e.innerText || e.value || '').trim().startsWith(text) && e.offsetParent !== null);
    },
    async moveTo(el) {
      el.scrollIntoView({block:'center', behavior:'smooth'});
      await new Promise(r => setTimeout(r, 650));
      const r = el.getBoundingClientRect();
      c.style.left = (r.left + Math.min(r.width * 0.5, 60)) + 'px';
      c.style.top = (r.top + r.height * 0.55) + 'px';
      await new Promise(r => setTimeout(r, 1000));
      return r;
    },
    async glide(el, offset = 140, ms = 1400) {
      const from = scrollY, t0 = performance.now();
      await new Promise(done => {
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / ms), e = 1 - Math.pow(1 - k, 3);
          const to = el.getBoundingClientRect().top + scrollY - offset;
          window.scrollTo(0, from + (to - from) * e);
          k < 1 ? requestAnimationFrame(step) : done();
        };
        requestAnimationFrame(step);
      });
      return 'ok';
    },
    heading(text) { return [...document.querySelectorAll('h2,h3')].find(h => h.innerText.startsWith(text)); },
    async click(text) {
      const el = this.find(text);
      if (!el) return 'missing: ' + text;
      const r = await this.moveTo(el);
      c.style.transform = 'scale(.85)';
      ring.style.left = (r.left + Math.min(r.width * 0.5, 60)) + 'px';
      ring.style.top = (r.top + r.height * 0.55) + 'px';
      ring.style.transition = 'none'; ring.style.opacity = 1; ring.style.transform = 'scale(.4)';
      requestAnimationFrame(() => { ring.style.transition = 'opacity .6s, transform .6s'; ring.style.opacity = 0; ring.style.transform = 'scale(1.4)'; });
      el.click();
      await new Promise(r => setTimeout(r, 180));
      c.style.transform = '';
      return 'ok';
    },
  };
})();
"""


class Tab:
    def __init__(self, ws_url: str, frames: pathlib.Path):
        self.ws = websocket.create_connection(ws_url, timeout=60, suppress_origin=True)
        self.n = 0
        self.dir = frames
        self.keep = False
        self.started = 0.0
        self.stamps: list[tuple[float, str]] = []

    def elapsed(self) -> float:
        """Page time since recording started."""
        return time.time() * SLOW - self.started

    def send(self, method: str, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})
            self._event(msg)

    def pump(self, seconds: float):
        """Let `seconds` of page time pass."""
        end = time.time() + seconds / SLOW
        self.ws.settimeout(0.5)
        while time.time() < end:
            try:
                self._event(json.loads(self.ws.recv()))
            except websocket.WebSocketTimeoutException:
                pass
        self.ws.settimeout(60)

    def _event(self, msg):
        if msg.get("method") != "Page.screencastFrame":
            return
        p = msg["params"]
        if self.keep:
            name = f"{len(self.stamps):06d}.jpg"
            (self.dir / name).write_bytes(base64.b64decode(p["data"]))
            self.stamps.append((time.time() * SLOW, name))  # page time
        self.ws.send(json.dumps({"id": 900_000 + self.n, "method": "Page.screencastFrameAck", "params": {"sessionId": p["sessionId"]}}))

    def snap(self):
        """A frame on demand: Chrome only streams frames when something changes, so a still page needs this."""
        data = self.send("Page.captureScreenshot", format="jpeg", quality=90)["data"]
        name = f"{len(self.stamps):06d}.jpg"
        (self.dir / name).write_bytes(base64.b64decode(data))
        self.stamps.append((time.time() * SLOW, name))

    def eval(self, expr: str):
        res = self.send("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True, userGesture=True)
        return res.get("result", {}).get("value")


def chrome(w: int, h: int, profile: pathlib.Path):
    shutil.rmtree(profile, ignore_errors=True)  # a fresh browser every take: no leftover demo state
    return subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={PORT}", f"--user-data-dir={profile}", f"--window-size={w},{h}",
         "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "--no-first-run", "--remote-allow-origins=*",
         "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def close(proc):
    """Chrome leaves child processes behind on Windows; take the whole tree down so the next take gets the port."""
    subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
    try:
        proc.wait(timeout=15)
    except subprocess.TimeoutExpired:
        pass


def attach(frames: pathlib.Path) -> Tab:
    end = time.time() + 30
    while time.time() < end:
        try:
            socket.create_connection(("localhost", PORT), timeout=1).close()
            break
        except OSError:
            time.sleep(0.3)
    # Chrome opens the port a moment before it answers on it.
    for _ in range(40):
        try:
            for t in json.loads(urllib.request.urlopen(f"http://localhost:{PORT}/json/list", timeout=5).read()):
                if t["type"] == "page":
                    return Tab(t["webSocketDebuggerUrl"], frames)
        except OSError:
            pass
        time.sleep(0.5)
    raise RuntimeError("no page target")


def take(name: str, steps: list, w=1920, h=1080, base=SITE, beats=(), length=0.0, zoom=1.0) -> pathlib.Path:
    """Run one take and return the encoded clip."""
    frames = HERE / "build" / "frames" / name
    shutil.rmtree(frames, ignore_errors=True)
    frames.mkdir(parents=True)
    cw, ch = round(w / zoom), round(h / zoom)  # CSS pixels; zoom > 1 makes the page larger on film
    proc = chrome(cw, ch, HERE / "build" / "profile")
    try:
        tab = attach(frames)
        tab.send("Page.enable")
        tab.send("Runtime.enable")
        tab.send("Emulation.setDeviceMetricsOverride", width=cw, height=ch, deviceScaleFactor=zoom, mobile=False)
        tab.send("Page.addScriptToEvaluateOnNewDocument", source=TIME_JS % SLOW)
        tab.send("Page.addScriptToEvaluateOnNewDocument", source=CURSOR_JS)
        tab.send("Animation.enable")
        tab.send("Animation.setPlaybackRate", playbackRate=SLOW)
        tab.send("Page.startScreencast", format="jpeg", quality=90, maxWidth=w, maxHeight=h, everyNthFrame=1)
        for step in steps:
            kind, arg = step[0], step[1] if len(step) > 1 else None
            if kind == "goto":
                tab.send("Page.navigate", url=base + arg)
                tab.pump(step[2] if len(step) > 2 else 4.0)
                tab.eval(CURSOR_JS)
            elif kind == "rec":
                tab.keep = arg
                tab.started = time.time() * SLOW
                if arg:
                    tab.snap()
            elif kind == "beat":
                extra = step[2] if len(step) > 2 else 0.0
                tab.pump(max(0.0, beats[arg] + extra - tab.elapsed()))
            elif kind == "type":
                tab.eval(f"""(async () => {{
                  const el = document.querySelector({json.dumps(arg)});
                  el.scrollIntoView({{block:'center', behavior:'smooth'}}); el.focus();
                  const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
                  const text = {json.dumps(step[2])};
                  for (let i = 1; i <= text.length; i++) {{
                    set.call(el, text.slice(0, i)); el.dispatchEvent(new Event('input', {{bubbles: true}}));
                    await new Promise(r => setTimeout(r, 38));
                  }}
                }})()""")
                tab.pump(0.2)
            elif kind == "photo":
                path = HERE / step[2]
                data = base64.b64encode(path.read_bytes()).decode()
                mime = mimetypes.guess_type(path.name)[0]
                tab.eval(f"""(async () => {{
                  const bytes = Uint8Array.from(atob({json.dumps(data)}), c => c.charCodeAt(0));
                  const file = new File([bytes], {json.dumps(path.name)}, {{type: {json.dumps(mime)}}});
                  const input = document.querySelector({json.dumps(arg)});
                  const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
                  input.dispatchEvent(new Event('change', {{bubbles: true}}));
                }})()""")
                tab.pump(0.2)
            elif kind == "wait":
                tab.pump(arg)
            elif kind == "click":
                out = tab.eval(f"window.__aw.click({json.dumps(arg)})")
                if out != "ok":
                    print(f"  {name}: {out}")
                tab.pump(0.4)
            elif kind == "js":
                tab.eval(arg)
                tab.pump(0.1)
            elif kind == "scroll":
                tab.eval(f"window.scrollBy({{top: {arg}, behavior: 'smooth'}})")
                tab.pump(1.2)
        if tab.keep and length:
            tab.pump(max(0.0, length - tab.elapsed()))  # never shorter than its narration
        if tab.keep:
            tab.snap()  # close the clip at the time it really ended
        tab.send("Page.stopScreencast")
        tab.ws.close()
    finally:
        close(proc)
    return encode(name, tab.stamps, frames, w, h)


def encode(name: str, stamps, frames: pathlib.Path, w: int, h: int) -> pathlib.Path:
    """Variable-rate frames to a constant 30 fps clip in real time."""
    out = HERE / "footage" / f"{name}.mp4"
    out.parent.mkdir(exist_ok=True)
    stamps = sorted(stamps)  # a snapshot can be stamped after frames that arrived while it was taken
    lines = []
    for (t, f), nxt in zip(stamps, stamps[1:] + [(stamps[-1][0] + 1 / FPS, None)]):
        lines += [f"file '{f}'", f"duration {max(nxt[0] - t, 0.001):.4f}"]
    lines.append(f"file '{stamps[-1][1]}'")
    (frames / "list.txt").write_text("\n".join(lines))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(frames / "list.txt"),
                    "-vf", f"scale={w}:{h}:flags=lanczos,fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(out)], check=True)
    span = stamps[-1][0] - stamps[0][0]
    print(f"  {name}: {len(stamps)} frames over {span:.1f}s = {len(stamps) / max(span, 0.01):.1f} fps -> {out.name}")
    shutil.rmtree(frames, ignore_errors=True)
    return out


if __name__ == "__main__":
    # Throughput check on the heaviest page.
    take("test-landing", [("goto", "/", 3), ("rec", True), ("wait", 4), ("click", "Watch it work"), ("wait", 2)])
