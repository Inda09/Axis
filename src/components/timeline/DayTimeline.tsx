"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { TimeRail } from "@/components/timeline/TimeRail";
import { SessionSegment } from "@/components/timeline/SessionSegment";
import type { DaySession } from "@/components/timeline/useDaySessions";
import { formatDurationMinutes, isSameDay } from "@/lib/time";
import { cn } from "@/lib/utils";

type DayTimelineProps = {
  date: Date;
  sessions: DaySession[];
  height: number;
};

export function DayTimeline({ date, sessions, height }: DayTimelineProps) {
  const [zoomMode, setZoomMode] = useState<"day" | "active">("day");
  const [selected, setSelected] = useState<{
    session: DaySession;
    top: number;
  } | null>(null);

  const now = new Date();
  const isToday = isSameDay(date, now);
  const nowMinute = now.getHours() * 60 + now.getMinutes();

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (zoomMode === "day" || sessions.length === 0) {
      return { rangeStart: 0, rangeEnd: 1440 };
    }
    const minStart = Math.min(
      ...sessions.map((s) => new Date(s.startTime).getHours() * 60 + new Date(s.startTime).getMinutes()),
    );
    const maxEnd = Math.max(
      ...sessions.map((s) => {
        const end = s.endTime ? new Date(s.endTime) : new Date();
        return end.getHours() * 60 + end.getMinutes();
      }),
    );
    return {
      rangeStart: Math.max(0, minStart - 30),
      rangeEnd: Math.min(1440, maxEnd + 30),
    };
  }, [sessions, zoomMode]);

  const span = rangeEnd - rangeStart;
  const minuteToOffset = (minute: number) =>
    ((minute - rangeStart) / span) * height;

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
          Timeline
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomMode("day")}
            className={cn(
              "rounded-full border border-[var(--border)] px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em]",
              zoomMode === "day"
                ? "bg-[var(--glass-2)] text-[var(--text-0)]"
                : "text-[var(--text-2)]",
            )}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setZoomMode("active")}
            className={cn(
              "rounded-full border border-[var(--border)] px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em]",
              zoomMode === "active"
                ? "bg-[var(--glass-2)] text-[var(--text-0)]"
                : "text-[var(--text-2)]",
            )}
          >
            Active
          </button>
        </div>
      </div>

      <div className="mt-6 flex h-full gap-6">
        <div className="w-20">
          <TimeRail
            height={height}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            nowMinute={isToday ? nowMinute : null}
          />
        </div>
        <div className="relative flex-1">
          <div className="absolute left-4 top-0 h-full w-px bg-white/10" />
          <div className="relative ml-6" style={{ height }}>
            {sessions.map((session) => {
              const start = new Date(session.startTime);
              const end = session.endTime ? new Date(session.endTime) : new Date();
              const startMin = start.getHours() * 60 + start.getMinutes();
              const endMin = end.getHours() * 60 + end.getMinutes();
              const top = minuteToOffset(startMin);
              const heightPx = Math.max(10, minuteToOffset(endMin) - top);
              return (
                <SessionSegment
                  key={session.id}
                  session={session}
                  top={top}
                  height={heightPx}
                  minHeight={10}
                  isSelected={selected?.session.id === session.id}
                  isRunning={!session.endTime}
                  onSelect={(selectedSession, selectedTop) =>
                    setSelected({ session: selectedSession, top: selectedTop })
                  }
                />
              );
            })}
          </div>

          {selected ? (
            <div
              className="absolute right-4 z-10 w-64"
              style={{ top: Math.max(0, selected.top - 12) }}
            >
              <GlassCard className="glass-panel-strong">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Session Details
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-0)]">
                  {selected.session.label}
                </p>
                <p className="mt-1 text-xs text-[var(--text-2)]">
                  {selected.session.source === "auto_closed"
                    ? "Auto-closed"
                    : "Manual"}
                </p>
                <p className="mt-3 text-xs text-[var(--text-1)]">
                  {formatDurationMinutes(selected.session.durationMinutes)}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-3 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]"
                >
                  Close
                </button>
              </GlassCard>
            </div>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
