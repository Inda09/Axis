"use client";

import { useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { useAxisStore } from "@/lib/store";
import { formatDurationMinutes, isSameDay, MINUTE } from "@/lib/time";
import { getSessionDurationMinutes } from "@/lib/session-utils";
import { getWorkDayRange, isLunchRequired } from "@/lib/schedule";

const getWeekStart = (date: Date) => {
  const day = date.getDay();
  const diff = (day + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export default function InsightsPage() {
  const { sessions, mode, workSchedule } = useAxisStore((state) => state);
  const now = new Date();

  const summary = useMemo(() => {
    const weekStart = getWeekStart(now);
    const weekDates = Array.from({ length: 7 }, (_, index) => {
      const next = new Date(weekStart);
      next.setDate(weekStart.getDate() + index);
      return next;
    });

    const weekSessions = sessions.filter(
      (session) =>
        session.mode === mode &&
        new Date(session.startTime) >= weekStart &&
        new Date(session.startTime) <= new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
    );

    let focusMinutes = 0;
    let breakMinutes = 0;
    weekSessions.forEach((session) => {
      const duration = getSessionDurationMinutes(session, now);
      if (session.type === "focus") {
        focusMinutes += duration;
      } else {
        breakMinutes += duration;
      }
    });

    let plannedMinutes = 0;
    let lunchRequiredDays = 0;
    let lunchCompletedDays = 0;

    if (mode === "work") {
      weekDates.forEach((day) => {
        const range = getWorkDayRange(day, workSchedule);
        if (!range) {
          return;
        }
        const planned = Math.round(
          (range.end.getTime() - range.start.getTime()) / MINUTE,
        );
        plannedMinutes += planned;
        if (isLunchRequired(planned)) {
          lunchRequiredDays += 1;
          const lunchLogged = sessions.some(
            (session) =>
              session.mode === "work" &&
              session.type === "lunch" &&
              isSameDay(new Date(session.startTime), day),
          );
          if (lunchLogged) {
            lunchCompletedDays += 1;
          }
        }
      });
    }

    const lunchCompliance =
      lunchRequiredDays === 0
        ? 100
        : Math.round((lunchCompletedDays / lunchRequiredDays) * 100);

    return {
      plannedMinutes,
      focusMinutes,
      breakMinutes,
      lunchCompliance,
      lunchRequiredDays,
    };
  }, [sessions, mode, workSchedule, now]);

  return (
    <PageTransition>
      <StaggerContainer>
        <div className="flex flex-col gap-6">
          <StaggerItem>
            <GlassCard className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Planned Hours
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-0)]">
                  {formatDurationMinutes(summary.plannedMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Logged Focus
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-0)]">
                  {formatDurationMinutes(summary.focusMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Break Totals
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-0)]">
                  {formatDurationMinutes(summary.breakMinutes)}
                </p>
              </div>
            </GlassCard>
          </StaggerItem>

          {mode === "work" ? (
            <StaggerItem>
              <GlassCard>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Lunch Compliance
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--text-0)]">
                  {summary.lunchCompliance}%
                </p>
                <p className="mt-2 text-xs text-[var(--text-2)]">
                  {summary.lunchRequiredDays} work days required lunch this week.
                </p>
              </GlassCard>
            </StaggerItem>
          ) : null}
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
