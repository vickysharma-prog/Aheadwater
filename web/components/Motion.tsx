"use client";
// Small motion building blocks shared by the app pages.
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.2, 0.7, 0.2, 1] as const;

/** Children enter one after another. */
export function Stagger({ children, className, gap = 0.07, ...rest }: { children: ReactNode; className?: string; gap?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} initial="hidden" animate="shown" variants={{ shown: { transition: { staggerChildren: gap } } }} {...rest}>
      {children}
    </motion.div>
  );
}

export const item = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export function Item({ children, className, ...rest }: { children: ReactNode; className?: string } & HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} variants={item} {...rest}>
      {children}
    </motion.div>
  );
}

/** Swaps content with a short cross-fade whenever `id` changes. */
export function Swap({ id, children, className }: { id: string | number; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** A tick that springs in. */
export function Pop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span className={className} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
      {children}
    </motion.span>
  );
}

export { motion };
