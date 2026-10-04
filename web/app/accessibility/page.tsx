// What we do so everyone can use Aheadwater, and how to tell us when something gets in the way.
import Link from "next/link";

import { Reveal } from "@/components/landing/Reveal";

export const metadata = { title: "Accessibility · Aheadwater" };

const ITEMS = [
  {
    title: "Less motion when you ask for it",
    text: "If your device is set to reduce motion, the animations, the smooth scrolling, the self-playing walkthrough and the background video stop. Every page still shows everything.",
  },
  {
    title: "A pause button on the video",
    text: "The ocean video on the home page has a pause button in its corner, and it carries no information you would miss.",
  },
  {
    title: "Works with a keyboard",
    text: "Every control is a real link or button, so Tab reaches it and Enter or Space uses it. A clear outline shows where you are, and a “Skip to content” link is the first stop on every page.",
  },
  {
    title: "The map is also a list",
    text: "Each site's risk level on the map is also written out in the table and the site cards next to it, so the map is never the only way to read it.",
  },
  {
    title: "Words, not only colours",
    text: "Every risk level and every step of a case is written as a word, such as Watch, Alert, Avoid contact or Team on site, as well as shown in colour.",
  },
  {
    title: "Plain language",
    text: "Public advisories say what to do in a few short words: avoid contact, keep dogs out. The public page is written for everyone, not for experts.",
  },
  {
    title: "Real tables and headings",
    text: "Pages use proper headings, labelled tables and labelled buttons, so screen readers can move through them and announce what each part is.",
  },
  {
    title: "Your photo stays on your phone",
    text: "The photo check on the report form runs on your own device. It looks at light and focus, so a photo that is too dark or blurred is turned back with a plain reason.",
  },
];

export default function Page() {
  return (
    <div className="bg-gradient-to-b from-slate-50 via-cyan-50/50 to-slate-50">
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center">
        <p className="rise text-sm font-semibold uppercase tracking-widest text-water">Accessibility</p>
        <h1 className="rise mt-3 text-4xl font-semibold tracking-tight sm:text-6xl" style={{ animationDelay: "0.1s" }}>
          Safe water information is for everyone
        </h1>
        <p className="rise mx-auto mt-6 max-w-2xl text-lg text-slate-600" style={{ animationDelay: "0.2s" }}>
          A warning only helps if people can read it. Here is what Aheadwater does so that everyone, on any device and in any way they browse, can use it.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <ul className="grid gap-4 md:grid-cols-2">
          {ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={(i % 2) * 80} className="h-full">
              <li className="h-full rounded-2xl bg-white p-6 shadow-lg shadow-cyan-950/5">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-slate-600">{item.text}</p>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 pt-10">
        <Reveal className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-cyan-950/5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tell us what gets in your way</h2>
          <p className="mt-4 text-lg text-slate-600">
            If any part of Aheadwater is hard to use with your device or the way you browse, open an issue on the project and we will fix it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://github.com/vickysharma-prog/Aheadwater/issues"
              target="_blank"
              rel="noopener"
              className="rounded-full bg-water px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
            >
              Report a problem
            </a>
            <Link href="/how-it-works" className="rounded-full border border-slate-300 px-6 py-3 font-semibold transition-colors hover:border-water hover:text-water">
              How it works
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
