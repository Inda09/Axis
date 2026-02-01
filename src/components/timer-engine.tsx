"use client";

import { useEffect, useRef } from "react";
import { axisActions, axisStore } from "@/lib/store";
import { useToasts } from "@/components/ui/toasts";
import type { SessionType } from "@/lib/models";

const NUDGE_THRESHOLDS: Record<
  SessionType,
  { minute: number; message: string }[]
> = {
  focus: [
    { minute: 50, message: "Focus interval complete." },
    { minute: 75, message: "Focus interval extended." },
  ],
  short_break: [
    { minute: 10, message: "Break complete." },
    { minute: 15, message: "Still on break?" },
  ],
  task_break: [],
  lunch: [
    { minute: 45, message: "Lunch complete." },
    { minute: 60, message: "Still on lunch?" },
  ],
};

const AUTO_END_MINUTES: Partial<Record<SessionType, number>> = {
  task_break: 3,
  lunch: 90,
};

export function TimerEngine() {
  const { pushToast } = useToasts();
  const lastSessionId = useRef<string | null>(null);
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const { currentSessionId, sessions } = axisStore.getState();
      if (!currentSessionId) {
        lastSessionId.current = null;
        fired.current.clear();
        return;
      }
      const session = sessions.find((item) => item.id === currentSessionId);
      if (!session || session.endTime) {
        return;
      }
      if (lastSessionId.current !== currentSessionId) {
        fired.current.clear();
        lastSessionId.current = currentSessionId;
      }
      const elapsedMinutes =
        (Date.now() - new Date(session.startTime).getTime()) / 60000;

      const autoEndAt = AUTO_END_MINUTES[session.type];
      if (autoEndAt && elapsedMinutes >= autoEndAt) {
        axisActions.autoEndSession();
        return;
      }

      const nudges = NUDGE_THRESHOLDS[session.type] ?? [];
      nudges.forEach((nudge) => {
        const key = `${currentSessionId}:${nudge.minute}`;
        if (elapsedMinutes >= nudge.minute && !fired.current.has(key)) {
          fired.current.add(key);
          pushToast({ title: nudge.message });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pushToast]);

  return null;
}
