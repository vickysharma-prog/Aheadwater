"use client";
import { useRouter } from "next/navigation";

import { type CityId } from "@/lib/scenario";
import { actions } from "@/lib/store";

const CARDS: { id: CityId; city: string; date: string; story: string; tint: string }[] = [
  {
    id: "ghent",
    city: "Ghent, Belgium",
    date: "May 2021",
    story: "Rain falls over the weekend. By Monday morning the forecast flags Blaarmeersen lake, and the lab confirms it the same day.",
    tint: "from-cyan-600 to-sky-500",
  },
  {
    id: "bengaluru",
    city: "Bengaluru, India",
    date: "August 2017",
    story: "Record rain, then foam on Varthur Lake. Reports and official monitoring open a case, and the same workflow runs it to the end.",
    tint: "from-teal-600 to-emerald-500",
  },
];

/** Picks the city for the replay and opens the console. */
export function Cities() {
  const router = useRouter();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {CARDS.map((c) => (
        <button
          key={c.id}
          onClick={() => (actions.setCity(c.id), router.push("/console"))}
          className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.tint} p-7 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
        >
          <svg className="absolute -bottom-4 left-0 w-[200%] opacity-20 transition-transform duration-[2000ms] group-hover:-translate-x-1/2" height="60" viewBox="0 0 800 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 30 Q 50 0 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30 V60 H0Z" fill="white" />
          </svg>
          <div className="text-sm font-medium text-white/80">{c.date}</div>
          <div className="mt-1 text-2xl font-semibold">{c.city}</div>
          <p className="mt-3 max-w-sm text-white/90">{c.story}</p>
          <span className="mt-6 inline-flex items-center gap-2 font-medium">
            Replay this case <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
          </span>
        </button>
      ))}
    </div>
  );
}
