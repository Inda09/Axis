"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 0, scale: 0.84, filter: "blur(14px)" }
      }
      animate={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      exit={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 0, scale: 0.8, filter: "blur(16px)" }
      }
      transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: "easeOut" }}
      className="relative w-full"
    >
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(118,255,43,0.22) 0%, rgba(118,255,43,0.08) 40%, transparent 70%)",
          }}
          initial={{ opacity: 0.1, scale: 0.8 }}
          animate={{ opacity: [0.12, 0.28, 0.12], scale: [0.85, 1.05, 0.85] }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      ) : null}
      {children}
    </motion.div>
  );
}
