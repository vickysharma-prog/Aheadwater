"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const TABS = [
  ["/how-it-works", "How it works"],
  ["/console", "Console"],
  ["/responder", "Responder"],
  ["/public", "Public page"],
  ["/health", "Health"],
  ["/fhir-explorer", "FHIR"],
  ["/judges", "Judges"],
] as const;

export function NavBar() {
  const path = usePathname();
  return (
    <header className="pointer-events-none sticky top-0 z-[1000] h-[64px]">
      <nav className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 pt-3 [&>*]:pointer-events-auto">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-2 font-semibold tracking-tight text-water shadow-lg shadow-cyan-950/10 backdrop-blur-xl">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-13z" fill="currentColor" />
            <path d="M8 15.5c1.3 1 2.6 1 4 0s2.7-1 4 0" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          Aheadwater
        </Link>

        <div className="min-w-0 flex-1 overflow-x-auto lg:absolute lg:left-1/2 lg:flex-none lg:-translate-x-1/2">
          <div className="mx-auto flex w-max gap-1 rounded-full border border-white/60 bg-white/55 p-1 shadow-lg shadow-cyan-950/10 backdrop-blur-xl">
            {TABS.map(([href, label]) => {
              const active = path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${active ? "text-white" : "text-slate-700 hover:text-water"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="tab"
                      className="absolute inset-0 rounded-full bg-water shadow"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/console"
          className="ml-auto hidden shrink-0 rounded-full bg-water px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/20 transition-transform hover:scale-105 xl:inline-block"
        >
          Start the replay
        </Link>
      </nav>
    </header>
  );
}
