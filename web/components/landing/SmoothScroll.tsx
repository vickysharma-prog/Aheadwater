"use client";
import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/** Eased page scrolling on the landing page. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: true }}>
      {children}
    </ReactLenis>
  );
}
