"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Mode } from "@/lib/models";
import { cn } from "@/lib/utils";

const modes: Mode[] = ["work", "home"];

export function ModeToggle({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="glass-panel inline-flex items-center gap-1 rounded-full p-1">
      {modes.map((mode) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              "relative rounded-full px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.32em] transition",
              active ? "text-[var(--text-0)]" : "text-[var(--text-2)]",
            )}
          >
            {active ? (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-full border border-[var(--border-2)] bg-[var(--glass-2)] shadow-[var(--glow)]"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 360, damping: 28 }
                }
              />
            ) : null}
            <span className="relative z-10">{mode}</span>
          </button>
        );
      })}
    </div>
  );
}
