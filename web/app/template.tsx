"use client";
import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Every page fades in when you arrive on it. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}
