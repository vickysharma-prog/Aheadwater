"""Speak every narration line and record how long each one runs.

Writes build/voice/<scene>-<n>.mp3 and build/voice/timing.json.
"""
import asyncio
import json
import pathlib
import subprocess

import edge_tts

from script import SCENES

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "build" / "voice"
VOICE, RATE = "en-US-AndrewNeural", "+4%"  # warm and unhurried, the voice used last time


def seconds(path: pathlib.Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(out.stdout.strip())


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    timing = {}
    for scene in SCENES:
        rows = []
        for i, (line, hold) in enumerate(scene["lines"]):
            mp3 = OUT / f"{scene['id']}-{i}.mp3"
            stamp = mp3.with_suffix(".txt")
            if not mp3.exists() or stamp.read_text(encoding="utf-8") != line:
                await edge_tts.Communicate(line, VOICE, rate=RATE).save(str(mp3))
                stamp.write_text(line, encoding="utf-8")
            rows.append({"line": line, "file": mp3.name, "dur": round(seconds(mp3), 3), "hold": hold})
        timing[scene["id"]] = rows
    (OUT / "timing.json").write_text(json.dumps(timing, indent=1))
    total = sum(r["dur"] + r["hold"] for rows in timing.values() for r in rows)
    for sid, rows in timing.items():
        print(f"{sid:10s} {sum(r['dur'] + r['hold'] for r in rows):6.1f}s")
    print(f"total {total:.1f}s ({int(total // 60)}:{int(total % 60):02d})")


asyncio.run(main())
