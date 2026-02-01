"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonProps = HTMLMotionProps<"button">;

const baseClasses =
  "flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-0)]";

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseClasses,
        "border border-[var(--border-2)] bg-[var(--bg-2)] text-[var(--text-0)] shadow-[var(--shadow-0)] hover:shadow-[var(--glow)] hover:border-[var(--acc-0)]",
        className,
      )}
      {...props}
    />
  );
}

export function SecondaryButton({ className, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseClasses,
        "border border-[var(--border)] bg-[var(--glass)] text-[var(--text-0)] hover:border-[var(--border-2)] hover:shadow-[var(--glow)]",
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        "glass-panel flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-0)] transition hover:shadow-[var(--glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]",
        className,
      )}
      {...props}
    />
  );
}
