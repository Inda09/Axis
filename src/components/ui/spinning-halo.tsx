"use client";

import { motion, useReducedMotion } from "framer-motion";

export function SpinningHalo({
  size = 36,
  thickness = 4,
  className = "",
}: {
  size?: number;
  thickness?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 0deg, rgba(118,255,43,0), rgba(118,255,43,0.7), rgba(118,255,43,0))",
        WebkitMask: `radial-gradient(transparent calc(50% - ${thickness}px), black 50%)`,
        mask: `radial-gradient(transparent calc(50% - ${thickness}px), black 50%)`,
      }}
      animate={reduceMotion ? undefined : { rotate: 360 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { repeat: Infinity, duration: 2.2, ease: "linear" }
      }
    />
  );
}
