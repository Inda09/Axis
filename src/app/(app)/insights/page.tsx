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
  const { sessions, shifts, tasks, mode, workSchedule } = useAxisStore((state) => state);
  const now = new Date();

  console.log('Insights data:', {
    sessionCount: sessions.length,
    shiftCount: shifts ? shifts.length : 0,
    taskCount: tasks.length
  });

  const summary = useMemo(() => {
    const weekStart = getWeekStart(now);
    const weekDates = Array.from({ length: 7 }, (_, index) => {
      const next = new Date(weekStart);
      next.setDate(weekStart.getDate() + index);
      return next;
    });

    const weekEndTimestamp = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).getTime();

    // 1. Total Hours Worked (from Shifts)
    // Filter shifts that started this week
    const weekShifts = (shifts || []).filter(shift => {
      const start = new Date(shift.startTime).getTime();
      return start >= weekStart.getTime() && start < weekEndTimestamp;
    });

    let totalWorkMinutes = 0;
    weekShifts.forEach(shift => {
      // If shift is ongoing, calculate until now
      const end = shift.endTime ? new Date(shift.endTime) : new Date();
      const start = new Date(shift.startTime);
      const durationMs = end.getTime() - start.getTime();
      totalWorkMinutes += Math.round(durationMs / 60000);
    });

    // 2. Tasks Completed
    const weekTasks = tasks.filter(task => {
      return task.completed && task.completedAt && new Date(task.completedAt).getTime() >= weekStart.getTime();
    });

    // 3. Average Task Time (from focus sessions with taskId)
    let totalTaskFocusMinutes = 0;
    let countedTasks = 0;
    // Map tasks to their total time
    const taskTimes: Record<string, number> = {};

    sessions.forEach(session => {
      if (session.taskId && session.type === 'focus') {
        const duration = getSessionDurationMinutes(session, now);
        taskTimes[session.taskId] = (taskTimes[session.taskId] || 0) + duration;
      }
    });

    // Average time for *completed* tasks this week
    let completedTaskTotalTime = 0;
    let completedTaskCountWithTime = 0;
    weekTasks.forEach(task => {
      if (taskTimes[task.id]) {
        completedTaskTotalTime += taskTimes[task.id];
        completedTaskCountWithTime++;
      }
    });

    const avgTaskMinutes = completedTaskCountWithTime > 0
      ? Math.round(completedTaskTotalTime / completedTaskCountWithTime)
      : 0;


    // Old Metrics (Planned, Focus, Break) based on sessions
    const weekSessions = sessions.filter(
      (session) =>
        session.mode === mode &&
        new Date(session.startTime) >= weekStart &&
        new Date(session.startTime) <= new Date(weekEndTimestamp),
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
      totalWorkMinutes,
      completedTasksCount: weekTasks.length,
      avgTaskMinutes
    };
  }, [sessions, mode, workSchedule, now, shifts, tasks]);

  return (
    <PageTransition>
      <StaggerContainer>
        <div className="flex flex-col gap-6">
          <StaggerItem>
            <h1 className="text-xl font-semibold text-[var(--text-0)]">Weekly Insights</h1>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-[var(--glass)] border border-[var(--border)]">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Hours Worked
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[var(--acc-0)]">
                    {Math.floor(summary.totalWorkMinutes / 60)}<span className="text-sm text-[var(--text-2)] font-normal ml-1">h</span>
                    {' '}{summary.totalWorkMinutes % 60}<span className="text-sm text-[var(--text-2)] font-normal ml-1">m</span>
                  </p>
                </div>
                <p className="text-xs text-[var(--text-2)] mt-1">Based on clock in/out shifts</p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--glass)] border border-[var(--border)]">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Tasks Done
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-0)]">
                  {summary.completedTasksCount}
                </p>
                <p className="text-xs text-[var(--text-2)] mt-1">Tasks completed this week</p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--glass)] border border-[var(--border)]">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Avg Task Time
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-0)]">
                  {summary.avgTaskMinutes}<span className="text-sm text-[var(--text-2)] font-normal ml-1">min</span>
                </p>
                <p className="text-xs text-[var(--text-2)] mt-1">For timed focus sessions</p>
              </div>
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <h2 className="text-sm font-medium text-[var(--text-1)] mb-2 mt-4">Session Analytics</h2>
          </StaggerItem>

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
                  Focus Time
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-0)]">
                  {formatDurationMinutes(summary.focusMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Break Time
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
