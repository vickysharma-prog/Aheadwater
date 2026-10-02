import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "lenis/dist/lenis.css";
import "./globals.css";

import { NavBar } from "@/components/NavBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aheadwater",
  description: "An early-warning and response system for city lakes and rivers: forecasts unsafe water a day ahead and runs the response until it is safe again.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
