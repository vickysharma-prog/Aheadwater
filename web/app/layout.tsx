import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aheadwater",
  description: "Warns a city before its river turns unsafe, then runs the response until it is fixed.",
};

const NAV = [
  ["/console", "Officer console"],
  ["/responder", "Responder"],
  ["/public", "Public page"],
  ["/fhir-explorer", "FHIR"],
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-water">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-13z" fill="currentColor" />
                <path d="M8 15.5c1.3 1 2.6 1 4 0s2.7-1 4 0" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </svg>
              Aheadwater
            </Link>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-water">
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
