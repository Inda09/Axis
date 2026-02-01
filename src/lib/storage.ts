import { STORAGE_KEY } from "@/lib/constants";
import type {
  AxisSettings,
  BrainDumpBoard,
  BusyBlock,
  Mode,
  DailyNotes,
  Session,
  Task,
  WorkSchedule,
} from "@/lib/models";

export type PersistedState = {
  mode: Mode;
  sessions: Session[];
  busyBlocks: BusyBlock[];
  workSchedule: WorkSchedule[];
  settings: AxisSettings;
  currentSessionId: string | null;
  tasks: Task[];
  notesByDay: Record<string, DailyNotes>;
  brainDumpByMode: Record<Mode, BrainDumpBoard>;
};

export function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedState) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures (private mode, quota, etc.).
  }
}
