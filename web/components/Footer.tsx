import Link from "next/link";

const LINKS = [
  ["/how-it-works", "How it works"],
  ["/accessibility", "Accessibility"],
  ["/fhir/metadata", "FHIR endpoint"],
  ["https://github.com/vickysharma-prog/Aheadwater", "Source code"],
  ["https://youtu.be/v87ago6cD8k", "Demo video"],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
          {LINKS.map(([href, label]) =>
            href.startsWith("http") ? (
              <a key={href} href={href} target="_blank" rel="noopener" className="hover:text-water hover:underline">
                {label}
              </a>
            ) : (
              <Link key={href} href={href} prefetch={href.startsWith("/fhir") ? false : undefined} className="hover:text-water hover:underline">
                {label}
              </Link>
            ),
          )}
        </nav>
        <p className="mt-4 text-slate-500">
          Built on real data: bathing-water samples from the European Environment Agency, E-OBS weather, monitoring from India&apos;s Central Pollution
          Control Board, and health cohorts from the OneAquaHealth sandbox. People and messages written for the demo carry the HL7 test-data tag. The model
          is tuned for the bathing season, when sites are sampled.
        </p>
      </div>
    </footer>
  );
}
