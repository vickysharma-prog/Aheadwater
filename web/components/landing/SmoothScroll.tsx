"use client";
import { ReactLenis } from "lenis/react";
import { useSyncExternalStore, type ReactNode } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const m = matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** Eased page scrolling on the landing page, off for people who ask for less motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useSyncExternalStore(subscribe, () => matchMedia(QUERY).matches, () => false);
  if (reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: true }}>
      {children}
    </ReactLenis>
  );
}
