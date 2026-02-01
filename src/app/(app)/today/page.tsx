"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { IconButton, PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { TimerRing } from "@/components/timer-ring";
import { axisStore, useAxisActions, useAxisStore } from "@/lib/store";
import { formatDate, formatTime, isSameDay } from "@/lib/time";
import { generateSuggestions, getWorkDayRange } from "@/lib/schedule";
import { getSessionDurationMinutes, getSessionLabel } from "@/lib/session-utils";

export default function TodayPage() {
  const { mode, sessions, currentSessionId, busyBlocks, workSchedule, settings, undoState } =
    useAxisStore((state) => state);
  const actions = useAxisActions();
  const [now, setNow] = useState<Date | null>(null);
  const [optimisticSessionId, setOptimisticSessionId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setNow(new Date());
  }, []);

  const currentSession = useMemo(() => {
    const activeId = currentSessionId ?? optimisticSessionId;
    const byId =
      sessions.find((session) => session.id === activeId) ?? null;
    if (byId) {
      return byId;
    }
    return (
      sessions.find((session) => session.mode === mode && !session.endTime) ??
      null
    );
  }, [sessions, currentSessionId, optimisticSessionId, mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleStart = (type: "focus" | "short_break" | "lunch" | "task_break") => {
    actions.startSession(type);
    const { currentSessionId: nextId } = axisStore.getState();
    if (nextId) {
      setOptimisticSessionId(nextId);
    }
  };


  const todaySessions = useMemo(() => {
    if (!now) {
      return [];
    }
    return sessions.filter(
      (session) =>
        session.mode === mode && isSameDay(new Date(session.startTime), now),
    );
  }, [sessions, mode, now]);

  const totals = useMemo(() => {
    if (!now) {
      return { focusMinutes: 0, breakMinutes: 0, breakCount: 0 };
    }
    let focusMinutes = 0;
    let breakMinutes = 0;
    let breakCount = 0;
    todaySessions.forEach((session) => {
      const duration = getSessionDurationMinutes(session, now);
      if (session.type === "focus") {
        focusMinutes += duration;
      } else {
        breakMinutes += duration;
        breakCount += 1;
      }
    });
    return { focusMinutes, breakMinutes, breakCount };
  }, [todaySessions, now]);

  const workHours = useMemo(() => {
    if (mode !== "work" || !now) {
      return null;
    }
    const range = getWorkDayRange(now, workSchedule);
    if (!range) {
      return null;
    }
    return `${formatTime(range.start)}-${formatTime(range.end)}`;
  }, [mode, now, workSchedule]);

  const nextSuggestion = useMemo(() => {
    if (mode !== "work" || !now) {
      return null;
    }
    const suggestions = generateSuggestions({
      date: now,
      schedule: workSchedule,
      busyBlocks: busyBlocks.filter((block) =>
        isSameDay(new Date(block.startTime), now),
      ),
      shortBreakMinutes: settings.work.shortBreakMinutes,
      lunchMinutes: settings.work.lunchMinutes,
    });
    return suggestions.find(
      (suggestion) => new Date(suggestion.startTime).getTime() >= now.getTime(),
    );
  }, [mode, now, workSchedule, busyBlocks, settings.work]);

  const todayBusyBlocks = useMemo(() => {
    if (mode !== "work" || !now) {
      return [];
    }
    return busyBlocks
      .filter((block) => isSameDay(new Date(block.startTime), now))
      .sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }, [busyBlocks, mode, now]);

  return (
    <>
      <PageTransition>
        <StaggerContainer>
          <div className="flex flex-col gap-6 lg:gap-8">
            <StaggerItem>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <ModeToggle value={mode} onChange={actions.setMode} />
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-1)]">
                  <span className="text-base font-semibold text-[var(--text-0)]">
                    {now ? formatDate(now) : "—"}
                  </span>
                  {workHours ? (
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                      {workHours}
                    </span>
                  ) : null}
                </div>
              </div>
            </StaggerItem>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="flex flex-col gap-6">
                {currentSession ? (
                  <StaggerItem>
                    <GlassCard className="glass-panel-strong flex flex-col items-center gap-6 py-8 lg:py-10">
                      <TimerRing
                        startTime={currentSession.startTime}
                        intendedMinutes={currentSession.intendedMinutes}
                        label={getSessionLabel(currentSession.type)}
                        isRunning
                        emphasisLabel={currentSession.type !== "focus"}
                      />
                      <div className="grid w-full gap-3 sm:grid-cols-2">
                        <SecondaryButton onClick={actions.endSession} type="button">
                          End Session
                        </SecondaryButton>
                        <SecondaryButton
                          onClick={actions.undoLastAction}
                          type="button"
                          disabled={!undoState}
                          className={!undoState ? "opacity-40" : ""}
                        >
                          Undo Last Action
                        </SecondaryButton>
                      </div>
                      <SecondaryButton type="button" onClick={() => setIsFullScreen(true)}>
                        Full Screen
                      </SecondaryButton>
                    </GlassCard>
                  </StaggerItem>
                ) : null}

                <StaggerItem>
                  <GlassCard className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-0)]">
                        {currentSession
                          ? `${getSessionLabel(currentSession.type)} running`
                          : "No session running"}
                      </p>
                    </div>
                    {currentSession ? (
                      <div className="text-right">
                        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                          Started
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-0)]">
                          {formatTime(new Date(currentSession.startTime))}
                        </p>
                      </div>
                    ) : null}
                  </GlassCard>
                </StaggerItem>

                {mode === "work" && nextSuggestion ? (
                  <StaggerItem>
                    <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-2)] bg-[var(--glass)] px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-1)] shadow-[var(--shadow-0)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]" />
                      Next {getSessionLabel(nextSuggestion.type)} at{" "}
                      {formatTime(new Date(nextSuggestion.startTime))}
                    </div>
                  </StaggerItem>
                ) : null}

                <StaggerItem>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <PrimaryButton onClick={() => handleStart("focus")} type="button">
                      Start Focus
                    </PrimaryButton>
                    <SecondaryButton onClick={() => handleStart("short_break")} type="button">
                      Short Break
                    </SecondaryButton>
                    <SecondaryButton onClick={() => handleStart("lunch")} type="button">
                      Lunch
                    </SecondaryButton>
                    <SecondaryButton onClick={() => handleStart("task_break")} type="button">
                      Task Break
                    </SecondaryButton>
                  </div>
                </StaggerItem>

                {mode === "work" ? (
                  <StaggerItem>
                    <GlassCard className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                          Busy Blocks
                        </p>
                        <Link
                          href="/calls"
                          className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[var(--acc-0)]"
                        >
                          Add Call
                        </Link>
                      </div>
                      {todayBusyBlocks.length === 0 ? (
                        <p className="text-sm text-[var(--text-2)]">No calls logged today.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {todayBusyBlocks.map((block) => (
                            <div
                              key={block.id}
                              className="flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--border)] px-3 py-2 text-[0.7rem] text-[var(--text-1)]"
                            >
                              <span>{block.title}</span>
                              <span>
                                {formatTime(new Date(block.startTime))}–
                                {formatTime(new Date(block.endTime))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </StaggerItem>
                ) : null}
              </div>

              <div className="flex flex-col gap-6">
                <StaggerItem>
                  <GlassCard className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                        Focus Time
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--text-0)]">
                        {Math.round(totals.focusMinutes)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                        Break Time
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--text-0)]">
                        {Math.round(totals.breakMinutes)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                        Break Count
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--text-0)]">
                        {totals.breakCount}
                      </p>
                    </div>
                  </GlassCard>
                </StaggerItem>

                <StaggerItem>
                  <GlassCard className="flex flex-col gap-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                      Workspace
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Link
                        href="/tasks"
                        className="glass-panel flex items-center justify-between rounded-[var(--r-md)] px-4 py-4 text-sm font-semibold text-[var(--text-0)] transition hover:shadow-[var(--glow)]"
                      >
                        Tasks & Priorities
                        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                          Open
                        </span>
                      </Link>
                      <Link
                        href="/notes"
                        className="glass-panel flex items-center justify-between rounded-[var(--r-md)] px-4 py-4 text-sm font-semibold text-[var(--text-0)] transition hover:shadow-[var(--glow)]"
                      >
                        Notes & Brain Dump
                        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                          Open
                        </span>
                      </Link>
                      <Link
                        href="/brain-dump"
                        className="glass-panel flex items-center justify-between rounded-[var(--r-md)] px-4 py-4 text-sm font-semibold text-[var(--text-0)] transition hover:shadow-[var(--glow)]"
                      >
                        Brain Dump Board
                        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                          Open
                        </span>
                      </Link>
                    </div>
                  </GlassCard>
                </StaggerItem>
              </div>
            </div>
          </div>
        </StaggerContainer>
      </PageTransition>

      <AnimatePresence>
        {isFullScreen && currentSession ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-0)]"
          >
            <div className="absolute right-6 top-6">
              <IconButton
                type="button"
                onClick={() => setIsFullScreen(false)}
                aria-label="Exit full screen"
              >
                ×
              </IconButton>
            </div>
            <GlassCard className="glass-panel-strong flex w-[92%] max-w-xl flex-col items-center gap-6 py-10">
              <div className="flex items-center gap-3 rounded-full border border-[var(--border-2)] bg-[var(--glass)] px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-1)]">
                <span className="h-2 w-2 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]" />
                {mode} mode
              </div>
              <p className="text-xl font-semibold uppercase tracking-[0.4em] text-[var(--text-0)]">
                {getSessionLabel(currentSession.type)}
              </p>
              <TimerRing
                startTime={currentSession.startTime}
                intendedMinutes={currentSession.intendedMinutes}
                label={getSessionLabel(currentSession.type)}
                isRunning
                emphasisLabel
              />
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <SecondaryButton onClick={actions.endSession} type="button">
                  End Session
                </SecondaryButton>
                <SecondaryButton
                  onClick={actions.undoLastAction}
                  type="button"
                  disabled={!undoState}
                  className={!undoState ? "opacity-40" : ""}
                >
                  Undo Last Action
                </SecondaryButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
