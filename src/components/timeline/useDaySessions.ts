import { useMemo } from "react";
import { useAxisStore } from "@/lib/store";
import type { Mode, Session } from "@/lib/models";
import { getSessionDurationMinutes, getSessionLabel } from "@/lib/session-utils";
import { getDayKey, isSameDay } from "@/lib/time";

export type DayTotals = {
  focusMinutes: number;
  breakMinutes: number;
  lunchMinutes: number;
  sessionCount: number;
};

export type DaySession = Session & {
  durationMinutes: number;
  label: string;
};

export function useDaySessions(date: Date, mode: Mode) {
  const sessions = useAxisStore((state) => state.sessions);
  const currentSessionId = useAxisStore((state) => state.currentSessionId);

  return useMemo(() => {
    const dayKey = getDayKey(date);
    const daySessions = sessions
      .filter(
        (session) =>
          session.mode === mode &&
          getDayKey(new Date(session.startTime)) === dayKey,
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )
      .map((session) => ({
        ...session,
        durationMinutes: getSessionDurationMinutes(session),
        label: getSessionLabel(session.type),
      }));

    const totals = daySessions.reduce<DayTotals>(
      (acc, session) => {
        if (session.type === "focus") {
          acc.focusMinutes += session.durationMinutes;
        } else if (session.type === "lunch") {
          acc.lunchMinutes += session.durationMinutes;
        } else {
          acc.breakMinutes += session.durationMinutes;
        }
        acc.sessionCount += 1;
        return acc;
      },
      { focusMinutes: 0, breakMinutes: 0, lunchMinutes: 0, sessionCount: 0 },
    );

    const runningSession = daySessions.find(
      (session) => session.id === currentSessionId && !session.endTime,
    );

    return { daySessions, totals, runningSession };
  }, [sessions, date, mode, currentSessionId]);
}
