"""Build the film: record every scene, frame the app takes, cut, caption, mix.

    python tts.py            # speak the narration first
    python build.py          # record everything, then assemble
    python build.py cut      # assemble again from footage already recorded
    python build.py only predict detect   # re-record just these scenes

Out: aheadwater-demo.mp4, 1920x1080, 30 fps, with aheadwater-demo.srt beside it.
"""
import functools
import http.server
import json
import pathlib
import subprocess
import sys
import threading

import rec
from script import SCENES

HERE = pathlib.Path(__file__).resolve().parent
BUILD = HERE / "build"
VOICE = BUILD / "voice"
FOOT = HERE / "footage"
OUT = HERE / "aheadwater-demo.mp4"
CARDS_PORT = 3334
XF = 0.45  # cross-fade between scenes, seconds
APP_W, APP_H, APP_X, APP_Y = 1640, 900, 140, 150  # where a take sits inside its frame


def seconds(path: pathlib.Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(out.stdout.strip())


def run(*args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *map(str, args)], check=True)


def timing():
    t = json.loads((VOICE / "timing.json").read_text())
    out = {}
    for sc in SCENES:
        rows, at = t[sc["id"]], 0.25
        beats = []
        for r in rows:
            beats.append(at)
            at += r["dur"] + r["hold"]
        out[sc["id"]] = {"beats": beats or [0.0], "length": sc.get("length", at), "rows": rows}
    return out


def serve_cards():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(HERE))
    handler.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(("localhost", CARDS_PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def record(sc, tm):
    if "card" in sc:
        beats = ",".join(f"{b:.2f}" for b in tm["beats"])
        steps = [("goto", f"/cards.html?scene={sc['card']}&beats={beats}", 3), ("rec", True), ("js", "go()")]
        return rec.take(sc["id"], steps, base=f"http://localhost:{CARDS_PORT}", beats=tm["beats"], length=tm["length"] + 0.6)
    frame = BUILD / f"frame-{sc['id']}.png"
    still(f"/cards.html?scene=frame&tag={sc['label']}&addr=aheadwater.vercel.app{sc['url']}", frame)
    return rec.take(sc["id"], sc["take"], w=APP_W, h=APP_H, beats=tm["beats"], length=tm["length"] + 0.6, zoom=1.25)


def still(path: str, out: pathlib.Path):
    """One frame of a card, for the background behind a take."""
    proc = rec.chrome(1920, 1080, BUILD / "profile")
    try:
        tab = rec.attach(BUILD)
        tab.send("Page.enable")
        tab.send("Emulation.setDeviceMetricsOverride", width=1920, height=1080, deviceScaleFactor=1, mobile=False)
        tab.send("Page.navigate", url=f"http://localhost:{CARDS_PORT}{path}")
        import time, base64
        time.sleep(3)
        data = tab.send("Page.captureScreenshot", format="png")["data"]
        out.write_bytes(base64.b64decode(data))
        tab.ws.close()
    finally:
        rec.close(proc)


def framed(sc, length: float) -> pathlib.Path:
    """The scene at exactly its length, at 1920x1080: a card as is, a take inside its frame."""
    src, out = FOOT / f"{sc['id']}.mp4", BUILD / "cut" / f"{sc['id']}.mp4"
    out.parent.mkdir(exist_ok=True)
    pad = f"tpad=stop_mode=clone:stop_duration={length},trim=duration={length},setpts=PTS-STARTPTS"
    if "card" in sc:
        run("-i", src, "-vf", f"{pad},format=yuv420p", "-r", 30, "-c:v", "libx264", "-crf", 16, "-preset", "fast", out)
    else:
        run("-framerate", 30, "-loop", 1, "-i", BUILD / f"frame-{sc['id']}.png", "-i", src,
            "-filter_complex", f"[1:v]scale={APP_W}:{APP_H}:flags=lanczos,{pad}[app];[0:v][app]overlay={APP_X}:{APP_Y}:shortest=1,format=yuv420p",
            "-t", length, "-r", 30, "-c:v", "libx264", "-crf", 16, "-preset", "fast", out)
    return out


def ass_time(t):
    h, m, s = int(t // 3600), int(t % 3600 // 60), t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def chunks(text, limit=58):
    words, out, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > limit and cur:
            out.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    out.append(cur)
    # Pair short pieces into two-line captions.
    return [" \\N".join(out[i:i + 2]) for i in range(0, len(out), 2)]


def captions(placed):
    head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Segoe UI Semibold,40,&H00FFFFFF,&H00FFFFFF,&H00301A06,&H96000000,0,0,0,0,100,100,0,0,4,0,0,2,200,200,42,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev, srt, n = [], [], 1
    for start, dur, line in placed:
        parts = chunks(line)
        total = sum(len(p) for p in parts)
        t = start
        for p in parts:
            d = dur * len(p) / total
            ev.append(f"Dialogue: 0,{ass_time(t)},{ass_time(t + d)},Cap,,0,0,0,,{p}")
            srt.append(f"{n}\n{srt_time(t)} --> {srt_time(t + d)}\n{p.replace(' \\N', chr(10))}\n")
            n += 1
            t += d
    (BUILD / "captions.ass").write_text(head + "\n".join(ev), encoding="utf-8")
    OUT.with_suffix(".srt").write_text("\n".join(srt), encoding="utf-8")


def music(seconds: float) -> pathlib.Path:
    """A soft pad: C, A minor, F, G, eight seconds each, sung by sine waves through a little reverb."""
    out = BUILD / "pad.wav"
    chords = [(261.63, 329.63, 392.00), (220.00, 261.63, 329.63), (174.61, 220.00, 261.63), (196.00, 246.94, 293.66)]
    parts = []
    for i in range(int(seconds // 8) + 1):
        a, b, c = chords[i % 4]
        parts.append(f"aevalsrc='0.22*sin(2*PI*{a}*t)+0.16*sin(2*PI*{b}*t)+0.14*sin(2*PI*{c}*t)+0.06*sin(2*PI*{a / 2}*t)':s=44100:d=8,"
                     f"afade=t=in:d=2.5,afade=t=out:st=5.5:d=2.5[c{i}]")
    graph = ";".join(parts) + ";" + "".join(f"[c{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1,lowpass=f=1400,aecho=0.8:0.7:60|120:0.35|0.25[out]"
    run("-filter_complex", graph, "-map", "[out]", "-t", seconds, out)
    return out


def drop() -> pathlib.Path:
    """The plop of the logo's water drop: a falling sine with a fast decay."""
    out = BUILD / "drop.wav"
    run("-f", "lavfi", "-i", "aevalsrc='0.6*sin(2*PI*(1400*exp(-9*t))*t)*exp(-14*t)':s=44100:d=0.6",
        "-af", "aecho=0.6:0.4:40|80:0.25|0.15", out)
    return out


def assemble(tm):
    clips, lengths = [], []
    for sc in SCENES:
        L = tm[sc["id"]]["length"] + 0.6
        if "take" in sc:
            # A take whose clicks outlast its narration keeps all of them; the voice simply finishes first.
            L = max(L, seconds(FOOT / f"{sc['id']}.mp4"))
        clip = framed(sc, L)
        got = seconds(clip)
        if abs(got - L) > 0.2:  # the cross-fades are timed on L, so a short clip would leave black behind it
            raise RuntimeError(f"{sc['id']}: clip is {got:.2f}s, expected {L:.2f}s")
        clips.append(clip)
        lengths.append(L)

    # Picture: cross-fade each scene into the next.
    inputs, graph, last, offset = [], [], "[0:v]", 0.0
    for c in clips:
        inputs += ["-i", c]
    starts = [0.0]
    for i in range(1, len(clips)):
        offset += lengths[i - 1] - XF
        starts.append(offset)
        graph.append(f"{last}[{i}:v]xfade=transition=fade:duration={XF}:offset={offset:.3f}[v{i}]")
        last = f"[v{i}]"
    total = starts[-1] + lengths[-1]

    # Sound: every line where its scene puts it.
    placed, voice_inputs, mix = [], [], []
    for sc, s0 in zip(SCENES, starts):
        for r, b in zip(tm[sc["id"]]["rows"], tm[sc["id"]]["beats"]):
            placed.append((s0 + b, r["dur"], r["line"]))
            voice_inputs += ["-i", VOICE / r["file"]]
    captions(placed)
    pad = music(total)
    n = len(clips)
    for k, (t, _, _) in enumerate(placed):
        ms = int(t * 1000)
        mix.append(f"[{n + k}:a]aresample=44100,adelay={ms}|{ms},apad[a{k}]")
    bed_i, pad_i, drop_i = n + len(placed), n + len(placed) + 1, n + len(placed) + 2
    audio = ";".join(mix) + ";" + "".join(f"[a{k}]" for k in range(len(placed))) + f"amix=inputs={len(placed)}:normalize=0:duration=longest[voice];"
    audio += f"[{bed_i}:a]aresample=44100,volume=0.10,afade=t=in:d=3,afade=t=out:st={total - 4:.2f}:d=4[bed];"
    audio += f"[{pad_i}:a]aresample=44100,volume=0.07,afade=t=in:d=4,afade=t=out:st={total - 5:.2f}:d=5[pad];"
    audio += f"[{drop_i}:a]aresample=44100,adelay=1180|1180,volume=0.9[drop];"
    audio += "[voice][bed][pad][drop]amix=inputs=4:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[aud]"

    subs = str(BUILD / "captions.ass").replace("\\", "/").replace(":", "\\:")
    video = ";".join(graph) + f";{last}ass='{subs}'[vid]"
    run(*inputs, *voice_inputs, "-stream_loop", -1, "-i", HERE / "assets" / "ocean-waves.ogg", "-i", pad, "-i", drop(),
        "-filter_complex", video + ";" + audio, "-map", "[vid]", "-map", "[aud]", "-t", f"{total:.3f}",
        "-c:v", "libx264", "-preset", "slow", "-crf", 19, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT)
    print(f"{OUT.name}: {int(total // 60)}:{total % 60:04.1f}")


def main():
    tm = timing()
    args = sys.argv[1:]
    srv = serve_cards()
    try:
        if not args or args[0] == "only":
            wanted = set(args[1:]) if args else {s["id"] for s in SCENES}
            for sc in SCENES:
                if sc["id"] in wanted:
                    print(f"recording {sc['id']} ({tm[sc['id']]['length']:.1f}s)")
                    for attempt in range(3):
                        try:
                            record(sc, tm[sc["id"]])
                            break
                        except Exception as e:  # one bad take should not stop the rest
                            print(f"  {sc['id']}: attempt {attempt + 1} failed: {e!r}")
        if not args or args[0] == "cut":
            assemble(tm)
    finally:
        srv.shutdown()


if __name__ == "__main__":
    main()
