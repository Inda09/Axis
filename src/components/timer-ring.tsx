"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatDurationSeconds } from "@/lib/time";
import { SpinningHalo } from "@/components/ui/spinning-halo";

type TimerRingProps = {
  startTime: string;
  intendedMinutes: number;
  label: string;
  isRunning: boolean;
  emphasisLabel?: boolean;
  variant?: "live" | "ambient";
};


function TimerRingBase({
  startTime,
  intendedMinutes,
  label,
  isRunning,
  emphasisLabel = false,
  variant = "live",
}: TimerRingProps) {
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const isAmbient = variant === "ambient";

  useEffect(() => {
    if (!isRunning || isAmbient) {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning, isAmbient]);

  const { elapsedSeconds, progress } = useMemo(() => {
    if (isAmbient) {
      return { elapsedSeconds: 0, progress: 0 };
    }
    const elapsed = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
    const intendedSeconds = intendedMinutes * 60;
    const nextProgress = intendedSeconds > 0 ? Math.min(1, elapsed / intendedSeconds) : 0;
    return { elapsedSeconds: elapsed, progress: nextProgress };
  }, [now, startTime, intendedMinutes, isAmbient]);

  const hasTarget = intendedMinutes > 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div
        animate={
          reduceMotion || !isRunning
            ? { opacity: 0.18, scale: 1 }
            : { opacity: [0.18, 0.28, 0.18], scale: [1, 1.02, 1] }
        }
        transition={
          reduceMotion || !isRunning
            ? { duration: 0 }
            : { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
        }
        className="absolute h-72 w-72 rounded-full bg-[var(--acc-0)] blur-3xl"
        style={{ opacity: 0.2 }}
      />
      <svg width="280" height="280" className="relative z-10">
        <circle
          cx="140"
          cy="140"
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="12"
          fill="none"
        />
        {hasTarget ? (
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke="var(--acc-0)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 140 140)"
          />
        ) : (
          <motion.g
            animate={reduceMotion ? { rotate: 0 } : { rotate: 360 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { repeat: Infinity, duration: 6, ease: "linear" }
            }
            transform="rotate(-90 140 140)"
          >
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="12"
              fill="none"
              strokeDasharray="4 16"
            />
            <circle
              cx="140"
              cy="30"
              r="6"
              fill="var(--acc-0)"
            />
          </motion.g>
        )}
      </svg>
      {isRunning && !reduceMotion ? (
        <SpinningHalo size={280} thickness={12} className="opacity-70" />
      ) : null}
      <div className="absolute z-20 flex flex-col items-center text-center">
        {isAmbient ? (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-[var(--text-0)]">
            Axis
          </p>
        ) : (
          <>
            <p
              className={
                emphasisLabel
                  ? "text-sm font-semibold uppercase tracking-[0.36em] text-[var(--text-0)]"
                  : "text-[0.6rem] uppercase tracking-[0.32em] text-[var(--text-2)]"
              }
            >
              {label}
            </p>
            <p className="mt-2 text-4xl font-semibold text-[var(--text-0)]">
              {formatDurationSeconds(elapsedSeconds)}
            </p>
            {hasTarget ? (
              <p className="mt-2 text-[0.6rem] uppercase tracking-[0.28em] text-[var(--text-2)]">
                {intendedMinutes}m target
              </p>
            ) : (
              <p className="mt-2 text-[0.6rem] uppercase tracking-[0.28em] text-[var(--text-2)]">
                Open-ended
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const TimerRing = memo(TimerRingBase);
