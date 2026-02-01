import type { Mode, Session, SessionType } from "@/lib/models";
import { isSameDay, MINUTE } from "@/lib/time";

export function getSessionsForDay(
  sessions: Session[],
  date: Date,
  mode: Mode,
) {
  return sessions.filter(
    (session) =>
      session.mode === mode && isSameDay(new Date(session.startTime), date),
  );
}

export function getSessionDurationMinutes(session: Session, now = new Date()) {
  const end = session.endTime ? new Date(session.endTime) : now;
  return Math.max(
    0,
    Math.round((end.getTime() - new Date(session.startTime).getTime()) / MINUTE),
  );
}

export function getSessionLabel(type: SessionType) {
  return type
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
