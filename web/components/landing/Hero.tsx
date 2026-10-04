"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const WORDS = ["Stop", "water", "crises", "before", "they", "start."];

const CHIPS = [
  { href: "/console", label: "Blaarmeersen, Ghent", status: "Flagged a day ahead", dot: "bg-amber-400", delay: 1.7 },
  { href: "/public", label: "Public page", status: "Advisory live in seconds", dot: "bg-emerald-400", delay: 1.85 },
  { href: "/responder", label: "Responders", status: "Team on site", dot: "bg-emerald-400", delay: 2.0 },
  { href: "/fhir-explorer", label: "HL7 FHIR", status: "0 validator errors", dot: "bg-sky-300", delay: 2.15 },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) video.current?.pause();
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative -mt-[64px] flex min-h-[100svh] items-center justify-center overflow-hidden bg-cyan-950 pb-32 pt-20 text-white">
      <motion.video
        ref={video}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ scale: videoScale }}
        className="absolute inset-0 h-full w-full object-cover"
        src="/video/ocean.mp4"
        poster="/video/ocean.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/60 via-cyan-950/30 to-cyan-950/75" aria-hidden="true" />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm backdrop-blur"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> For cities, their lakes and rivers, and everyone who loves them
        </motion.p>
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          {WORDS.map((w, i) => (
            <motion.span
              key={i}
              className="mr-[0.25em] inline-block"
              initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 120, damping: 14 }}
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-cyan-50 sm:text-xl"
        >
          Aheadwater is an early-warning and response system for city lakes and rivers. It forecasts unsafe water a day ahead, alerts the right people at
          once, and tracks every case until the water is safe again.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.8 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <motion.span whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link href="/console" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-lg font-semibold text-water shadow-xl shadow-cyan-950/30">
              Watch it work <span aria-hidden="true">&rarr;</span>
            </Link>
          </motion.span>
          <motion.span whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link href="/public" className="inline-flex rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-lg font-semibold backdrop-blur hover:bg-white/20">
              Is my water safe today?
            </Link>
          </motion.span>
          <motion.span whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <a href="https://youtu.be/v87ago6cD8k" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-lg font-semibold backdrop-blur hover:bg-white/20">
              <span aria-hidden="true">▶</span> Watch the demo
            </a>
          </motion.span>
        </motion.div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {CHIPS.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
              transition={{
                opacity: { delay: c.delay, duration: 0.6 },
                scale: { delay: c.delay, duration: 0.6 },
                y: { delay: c.delay + i * 0.4, duration: 4.5, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href={c.href}
                className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-left backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full ${c.dot} opacity-60`} />
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${c.dot}`} />
                </span>
                <span>
                  <span className="block text-xs text-white/70">{c.label}</span>
                  <span className="block text-sm font-medium">{c.status}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.a
        href="#how"
        aria-label="Scroll to how it works"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
        className="absolute bottom-16 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
      >
        <span className="cue flex h-11 w-7 justify-center rounded-full border-2 border-white/60 pt-2">
          <span className="h-2 w-1 rounded-full bg-white" />
        </span>
      </motion.a>
      <button
        type="button"
        onClick={() => (playing ? video.current?.pause() : video.current?.play())}
        aria-label={playing ? "Pause background video" : "Play background video"}
        className="absolute bottom-6 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          {playing ? <path d="M3 2h3v10H3zM8 2h3v10H8z" /> : <path d="M3 1.5v11l9-5.5z" />}
        </svg>
      </button>
      <p className="absolute bottom-2 right-3 z-10 text-[10px] text-white/50">Video: Pexels</p>
    </section>
  );
}
