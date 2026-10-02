"use client";
import { useState } from "react";

const PARTS = [
  { name: "Water", text: "Every lake and river scored each day, with weather rules for algae, oxygen and sewer overflow.", icon: "M12 3C9 8 6 11 6 14a6 6 0 0 0 12 0c0-3-3-6-6-11z" },
  { name: "Animals", text: "Local vets hear the moment a case opens. Dogs often swim first, so they are often first to show it.", icon: "M8 7a2 2 0 1 0 0-.1M16 7a2 2 0 1 0 0-.1M5 12a2 2 0 1 0 0-.1M19 12a2 2 0 1 0 0-.1M12 20c-3 0-5-2-5-4s2-4 5-4 5 2 5 4-2 4-5 4z" },
  { name: "People", text: "Public health learns which neighbourhoods live near the water, and families see a clear warning or the all-clear.", icon: "M9 8a3 3 0 1 0 0-.1M17 9a2.5 2.5 0 1 0 0-.1M3 20c0-3 3-5 6-5s6 2 6 5M14 15c3 0 6 1.5 6 4" },
];

/** Water, animals, people: tap one to read how Aheadwater looks after it. */
export function OneHealth() {
  const [open, setOpen] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-6">
        {PARTS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => setOpen(i)}
            aria-pressed={open === i}
            className={`relative flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105 ${
              open === i ? "border-water bg-water text-white shadow-xl shadow-cyan-900/20" : "border-cyan-100 bg-white text-water"
            }`}
          >
            {open === i && <span className="ping-soft absolute inset-0 rounded-full border-2 border-water" aria-hidden="true" />}
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={p.icon} />
            </svg>
            <span className="mt-1 font-semibold">{p.name}</span>
          </button>
        ))}
      </div>
      <p key={open} className="rise mx-auto mt-8 max-w-xl text-center text-lg text-slate-700">
        {PARTS[open].text}
      </p>
    </div>
  );
}
