"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { DatePicker } from "@/components/ui/date-time-picker";
import { SecondaryButton } from "@/components/ui/buttons";
import { TimerRing } from "@/components/timer-ring";
import { useAxisActions, useAxisStore } from "@/lib/store";
import { formatDurationMinutes, getDayKey } from "@/lib/time";
import { useDaySessions } from "@/components/timeline/useDaySessions";
import { DayTimeline } from "@/components/timeline/DayTimeline";
import { TimelineLegend } from "@/components/timeline/TimelineLegend";

export default function TimelinePage() {
  const actions = useAxisActions();
  const mode = useAxisStore((state) => state.mode);
  const [selectedDate, setSelectedDate] = useState(() => getDayKey(new Date()));
  const date = useMemo(() => new Date(selectedDate), [selectedDate]);
  const { daySessions, totals, runningSession } = useDaySessions(date, mode);

  const [height, setHeight] = useState(720);

  useEffect(() => {
    const updateHeight = () => {
      const viewport = window.innerHeight;
      const nextHeight = Math.max(700, Math.min(980, viewport - 320));
      setHeight(nextHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <PageTransition>
      <StaggerContainer>
        <div className="flex flex-col gap-6 lg:gap-8">
          <StaggerItem>
            <GlassCard className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Day
                </p>
                <DatePicker value={selectedDate} onChange={setSelectedDate} />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Mode
                </p>
                <ModeToggle value={mode} onChange={actions.setMode} />
              </div>
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Focus
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--text-0)]">
                  {formatDurationMinutes(totals.focusMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Breaks
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--text-0)]">
                  {formatDurationMinutes(totals.breakMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Lunch
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--text-0)]">
                  {formatDurationMinutes(totals.lunchMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Sessions
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--text-0)]">
                  {totals.sessionCount}
                </p>
              </div>
            </GlassCard>
          </StaggerItem>

          {runningSession ? (
            <StaggerItem>
              <GlassCard className="glass-panel-strong flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="scale-[0.6]">
                    <TimerRing
                      startTime={runningSession.startTime}
                      intendedMinutes={runningSession.intendedMinutes}
                      label={runningSession.label}
                      isRunning
                    />
                  </div>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                      Live Session
                    </p>
                    <p className="text-lg font-semibold text-[var(--text-0)]">
                      {runningSession.label}
                    </p>
                  </div>
                </div>
                <SecondaryButton type="button" className="sm:w-40" onClick={actions.endSession}>
                  End
                </SecondaryButton>
              </GlassCard>
            </StaggerItem>
          ) : null}

          <StaggerItem>
            <DayTimeline date={date} sessions={daySessions} height={height} />
          </StaggerItem>

          <StaggerItem>
            <TimelineLegend />
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
