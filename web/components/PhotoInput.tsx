"use client";
import { useState } from "react";

import { checkPhoto, isWater, toGray, type Check } from "@/lib/photo";

export type CheckedPhoto = { thumb: string; checks: Check[]; water?: { label: string; p: number } };

async function analyse(file: File): Promise<CheckedPhoto> {
  const bitmap = await createImageBitmap(file);
  const draw = (width: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round((bitmap.height / bitmap.width) * width);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  };
  const small = draw(256);
  const pixels = small.getContext("2d")!.getImageData(0, 0, small.width, small.height).data;
  const checks = checkPhoto(toGray(pixels), small.width, small.height);
  const thumb = draw(320).toDataURL("image/jpeg", 0.7);

  // Water in frame: MobileNet (ImageNet) in the browser, loaded only when a photo is added.
  let water: CheckedPhoto["water"];
  try {
    const [tf, mobilenet] = await Promise.all([import("@tensorflow/tfjs-core"), import("@tensorflow-models/mobilenet")]);
    await import("@tensorflow/tfjs-backend-webgl");
    await tf.ready();
    const model = await mobilenet.load({ version: 2, alpha: 0.5 });
    const top = (await model.classify(draw(224), 5)).find((p) => isWater(p.className));
    if (top) water = { label: top.className.split(",")[0], p: top.probability };
  } catch {
    // No model, no water check: the light and focus checks still stand.
  }
  return { thumb, checks, water };
}

export function PhotoInput({ onChange }: { onChange: (photo: CheckedPhoto | undefined) => void }) {
  const [state, setState] = useState<"idle" | "checking" | "done">("idle");
  const [photo, setPhoto] = useState<CheckedPhoto>();

  async function pick(file?: File) {
    if (!file) return;
    setState("checking");
    const p = await analyse(file);
    setPhoto(p);
    setState("done");
    onChange(p.checks.every((c) => c.pass) ? p : undefined);
  }

  const ok = photo?.checks.every((c) => c.pass);
  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" capture="environment" onChange={(e) => pick(e.target.files?.[0])} className="block text-sm" />
      {state === "checking" && <p className="text-xs text-slate-500">Checking the photo. The first time, a small image model loads in your browser; the photo never leaves it.</p>}
      {state === "done" && photo && (
        <div className="flex gap-3 rounded-md border border-slate-200 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.thumb} alt="Your photo" className="h-20 w-28 rounded object-cover" />
          <ul className="space-y-0.5 text-xs">
            {photo.checks.map((c) => (
              <li key={c.name} className={c.pass ? "text-ok" : "text-alert"}>
                {c.pass ? "✓" : "✗"} {c.name}: {c.detail}
              </li>
            ))}
            <li className={photo.water ? "text-ok" : "text-slate-500"}>
              {photo.water ? `✓ Water in frame (recognised as "${photo.water.label}")` : "? No open water recognised. That is fine for close-ups."}
            </li>
            {!ok && <li className="font-medium text-alert">Please take another photo, or send the report without one.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
