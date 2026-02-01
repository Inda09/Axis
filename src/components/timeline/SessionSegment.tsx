"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DaySession } from "@/components/timeline/useDaySessions";
import { formatTime } from "@/lib/time";

type SegmentProps = {
  session: DaySession;
  top: number;
  height: number;
  minHeight: number;
  isSelected: boolean;
  onSelect: (session: DaySession, top: number) => void;
  isRunning: boolean;
};

const typeStyles: Record<DaySession["type"], string> = {
  focus: "border-[var(--border-2)] shadow-[var(--glow)]",
  short_break: "border-[var(--border)] bg-[var(--glass)]",
  lunch: "border-[var(--border)] bg-[var(--glass-2)]",
  task_break: "border-[var(--border)] bg-[var(--glass)]",
};

export function SessionSegment({
  session,
  top,
  height,
  minHeight,
  isSelected,
  onSelect,
  isRunning,
}: SegmentProps) {
  const displayHeight = Math.max(height, minHeight);
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(session, top)}
      className={cn(
        "absolute left-0 w-full rounded-[var(--r-md)] border px-3 py-2 text-left text-xs text-[var(--text-0)] transition",
        typeStyles[session.type],
        isSelected && "ring-2 ring-[var(--acc-0)]",
        isRunning && "animate-pulse",
      )}
      style={{ top, height: displayHeight }}
    >
      <div className="flex items-center justify-between text-[0.55rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
        <span>{session.label}</span>
        {session.source === "auto_closed" ? (
          <span className="text-[var(--acc-0)]">Auto</span>
        ) : null}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span>
          {formatTime(new Date(session.startTime))}–
          {session.endTime ? formatTime(new Date(session.endTime)) : "Running"}
        </span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.2em] text-[var(--text-2)]">
          {session.durationMinutes}m
        </span>
      </div>
    </motion.button>
  );
}
