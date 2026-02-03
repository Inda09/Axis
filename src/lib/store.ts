/* eslint-disable no-use-before-define */
"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type {
  AxisSettings,
  BrainDumpBoard,
  BrainDumpBoardItem,
  BrainDumpItem,
  BusyBlock,
  DailyNotes,
  Mode,
  Session,
  SessionSource,
  SessionType,
  Task,
  TaskPriority,
  WorkSchedule,
  Shift,
} from "@/lib/models";
import {
  DEFAULT_SETTINGS,
  DEFAULT_WORK_SCHEDULE,
} from "@/lib/models";
import { loadPersistedState, savePersistedState } from "@/lib/storage";
import { createId } from "@/lib/utils";

export type AxisState = {
  mode: Mode;
  sessions: Session[];
  busyBlocks: BusyBlock[];
  workSchedule: WorkSchedule[];
  shifts: Shift[];
  currentShiftId: string | null;
  settings: AxisSettings;
  currentSessionId: string | null;
  tasks: Task[];
  notesByDay: Record<string, DailyNotes>;
  brainDumpByMode: Record<Mode, BrainDumpBoard>;
  undoState: {
    sessions: Session[];
    currentSessionId: string | null;
  } | null;
};

const defaultState: AxisState = {
  mode: "work",
  sessions: [],
  busyBlocks: [],
  workSchedule: DEFAULT_WORK_SCHEDULE,
  shifts: [],
  currentShiftId: null,
  settings: DEFAULT_SETTINGS,
  currentSessionId: null,
  tasks: [],
  notesByDay: {},
  brainDumpByMode: {
    work: {
      items: [],
      camera: { x: 0, y: 0, zoom: 1 },
      snapToGrid: false,
      gridSize: 24,
      doodleDataUrl: null,
    },
    home: {
      items: [],
      camera: { x: 0, y: 0, zoom: 1 },
      snapToGrid: false,
      gridSize: 24,
      doodleDataUrl: null,
    },
  },
  undoState: null,
};

const defaultNotes: DailyNotes = {
  meetingNotes: "",
  brainDump: "",
  brainDumpItems: [],
  doodleDataUrl: null,
};

type Listener = () => void;

const listeners = new Set<Listener>();
let state: AxisState = defaultState;

const getPersistedState = (nextState: AxisState) => ({
  mode: nextState.mode,
  sessions: nextState.sessions,
  busyBlocks: nextState.busyBlocks,
  workSchedule: nextState.workSchedule,
  shifts: nextState.shifts,
  currentShiftId: nextState.currentShiftId,
  settings: nextState.settings,
  currentSessionId: nextState.currentSessionId,
  tasks: nextState.tasks,
  notesByDay: nextState.notesByDay,
  brainDumpByMode: nextState.brainDumpByMode,
});

const notify = () => listeners.forEach((listener) => listener());

const setState = (updater: AxisState | ((prev: AxisState) => AxisState)) => {
  const nextState = typeof updater === "function" ? updater(state) : updater;
  state = nextState;
  savePersistedState(getPersistedState(state));
  notify();
};

const getCurrentSession = (nextState: AxisState) =>
  nextState.sessions.find((session) => session.id === nextState.currentSessionId) ??
  null;

const updateSession = (
  nextState: AxisState,
  sessionId: string,
  updater: (session: Session) => Session,
) => ({
  ...nextState,
  sessions: nextState.sessions.map((session) =>
    session.id === sessionId ? updater(session) : session,
  ),
});

const closeSession = (source: SessionSource) =>
  setState((prev) => {
    if (!prev.currentSessionId) {
      return prev;
    }
    const session = prev.sessions.find(
      (item) => item.id === prev.currentSessionId,
    );
    if (!session || session.endTime) {
      return prev;
    }
    const nextState = updateSession(prev, prev.currentSessionId, (item) => ({
      ...item,
      endTime: new Date().toISOString(),
      source,
    }));
    return {
      ...nextState,
      currentSessionId: null,
      undoState:
        source === "auto_closed"
          ? {
            sessions: prev.sessions,
            currentSessionId: prev.currentSessionId,
          }
          : prev.undoState,
    };
  });

const updateShift = (
  nextState: AxisState,
  shiftId: string,
  updater: (shift: Shift) => Shift,
) => ({
  ...nextState,
  shifts: nextState.shifts.map((shift) =>
    shift.id === shiftId ? updater(shift) : shift
  )
});

export const axisActions = {
  setMode(nextMode: Mode) {
    setState((prev) => {
      // If we are clocking into a shift, maybe we change mode automatically?
      // Logic for changing mode stays same
      if (prev.mode === nextMode) {
        return prev;
      }
      const current = prev.sessions.find(
        (session) => session.id === prev.currentSessionId,
      );
      if (current && !current.endTime && current.mode !== nextMode) {
        const now = new Date().toISOString();
        const nextState = updateSession(prev, prev.currentSessionId as string, (item) => ({
          ...item,
          endTime: now,
          source: "auto_closed",
        }));
        return {
          ...nextState,
          mode: nextMode,
          currentSessionId: null,
          undoState: {
            sessions: prev.sessions,
            currentSessionId: prev.currentSessionId,
          },
        };
      }
      return { ...prev, mode: nextMode };
    });
  },
  clockIn() {
    setState((prev) => {
      if (prev.currentShiftId) return prev; // Already clocked in
      const now = new Date().toISOString();
      const newShift: Shift = {
        id: createId(),
        mode: prev.mode,
        startTime: now,
        endTime: null,
      };
      return {
        ...prev,
        shifts: [...(prev.shifts || []), newShift],
        currentShiftId: newShift.id,
      };
    });
  },
  clockOut() {
    setState((prev) => {
      if (!prev.currentShiftId) return prev;
      const now = new Date().toISOString();
      const nextState = updateShift(prev, prev.currentShiftId, (s) => ({
        ...s, endTime: now
      }));
      return {
        ...nextState,
        currentShiftId: null,
      };
    });
  },
  startSession(type: SessionType, taskId?: string) {
    setState((prev) => {
      const now = new Date().toISOString();
      const modeSettings = prev.settings[prev.mode];
      const intendedMinutes =
        type === "focus"
          ? modeSettings.focusMinutes
          : type === "short_break"
            ? modeSettings.shortBreakMinutes
            : type === "lunch"
              ? modeSettings.lunchMinutes
              : modeSettings.taskBreakMinutes;
      const newSession: Session = {
        id: createId(),
        mode: prev.mode,
        type,
        startTime: now,
        endTime: null,
        intendedMinutes,
        source: "manual",
        taskId: taskId, // Assign task if provided
      };
      let nextState: AxisState = { ...prev };
      if (prev.currentSessionId) {
        nextState = updateSession(prev, prev.currentSessionId, (item) => ({
          ...item,
          endTime: now,
          source: "auto_closed",
        }));
        nextState.undoState = {
          sessions: prev.sessions,
          currentSessionId: prev.currentSessionId,
        };
      }
      return {
        ...nextState,
        sessions: [...nextState.sessions, newSession],
        currentSessionId: newSession.id,
      };
    });
  },
  endSession() {
    closeSession("manual");
  },
  autoEndSession() {
    closeSession("auto_closed");
  },
  undoLastAction() {
    setState((prev) => {
      if (!prev.undoState) {
        return prev;
      }
      return {
        ...prev,
        sessions: prev.undoState.sessions,
        currentSessionId: prev.undoState.currentSessionId,
        undoState: null,
      };
    });
  },
  addBusyBlock(block: Omit<BusyBlock, "id">) {
    const newBlock: BusyBlock = { ...block, id: createId() };
    setState((prev) => ({ ...prev, busyBlocks: [...prev.busyBlocks, newBlock] }));
  },
  updateBusyBlock(id: string, updates: Partial<Omit<BusyBlock, "id">>) {
    setState((prev) => ({
      ...prev,
      busyBlocks: prev.busyBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block,
      ),
    }));
  },
  deleteBusyBlock(id: string) {
    setState((prev) => ({
      ...prev,
      busyBlocks: prev.busyBlocks.filter((block) => block.id !== id),
    }));
  },
  updateSettings(mode: Mode, updates: Partial<AxisSettings[Mode]>) {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [mode]: { ...prev.settings[mode], ...updates },
      },
    }));
  },
  setWorkSchedule(schedule: WorkSchedule[]) {
    setState((prev) => ({ ...prev, workSchedule: schedule }));
  },
  addTask(title: string, priority: TaskPriority, mode: Mode) {
    const next: Task = {
      id: createId(),
      title,
      mode,
      priority,
      createdAt: new Date().toISOString(),
      deferredUntil: null,
      completed: false,
      completedAt: null,
    };
    setState((prev) => ({ ...prev, tasks: [next, ...prev.tasks] }));
  },
  deleteTask(id: string) {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== id),
    }));
  },
  delayTask(id: string) {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id
          ? {
            ...task,
            deferredUntil: new Date(
              new Date().getTime() + 24 * 60 * 60 * 1000,
            ).toISOString(),
          }
          : task,
      ),
    }));
  },
  updateTask(id: string, updates: Partial<Task>) {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
  },
  toggleTaskCompletion(id: string) {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id
          ? {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : null,
          }
          : task,
      ),
    }));
  },
  updateNotes(dayKey: string, mode: Mode, updates: Partial<DailyNotes>) {
    const key = `${dayKey}_${mode}`;
    setState((prev) => ({
      ...prev,
      notesByDay: {
        ...prev.notesByDay,
        [key]: {
          ...defaultNotes,
          ...prev.notesByDay[key],
          ...updates,
        },
      },
    }));
  },
  addBrainDumpItem(dayKey: string, mode: Mode, text: string) {
    const key = `${dayKey}_${mode}`;
    const item: BrainDumpItem = {
      id: createId(),
      text,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      notesByDay: {
        ...prev.notesByDay,
        [key]: {
          ...defaultNotes,
          ...prev.notesByDay[key],
          brainDumpItems: [item, ...(prev.notesByDay[key]?.brainDumpItems ?? [])],
        },
      },
    }));
  },
  deleteBrainDumpItem(dayKey: string, mode: Mode, itemId: string) {
    const key = `${dayKey}_${mode}`;
    setState((prev) => ({
      ...prev,
      notesByDay: {
        ...prev.notesByDay,
        [key]: {
          ...defaultNotes,
          ...prev.notesByDay[key],
          brainDumpItems: (prev.notesByDay[key]?.brainDumpItems ?? []).filter(
            (item) => item.id !== itemId,
          ),
        },
      },
    }));
  },
  setDoodle(dayKey: string, mode: Mode, dataUrl: string | null) {
    const key = `${dayKey}_${mode}`;
    setState((prev) => ({
      ...prev,
      notesByDay: {
        ...prev.notesByDay,
        [key]: {
          ...defaultNotes,
          ...prev.notesByDay[key],
          doodleDataUrl: dataUrl,
        },
      },
    }));
  },
  addBrainDumpBoardItem(mode: Mode, item: BrainDumpBoardItem) {
    setState((prev) => ({
      ...prev,
      brainDumpByMode: {
        ...prev.brainDumpByMode,
        [mode]: {
          ...prev.brainDumpByMode[mode],
          items: [item, ...prev.brainDumpByMode[mode].items],
        },
      },
    }));
  },
  setBrainDumpGrid(
    mode: Mode,
    updates: Partial<Pick<BrainDumpBoard, "snapToGrid" | "gridSize">>,
  ) {
    setState((prev) => ({
      ...prev,
      brainDumpByMode: {
        ...prev.brainDumpByMode,
        [mode]: {
          ...prev.brainDumpByMode[mode],
          ...updates,
        },
      },
    }));
  },
  updateBrainDumpBoardItem(mode: Mode, itemId: string, updates: Partial<BrainDumpBoardItem>) {
    setState((prev) => ({
      ...prev,
      brainDumpByMode: {
        ...prev.brainDumpByMode,
        [mode]: {
          ...prev.brainDumpByMode[mode],
          items: prev.brainDumpByMode[mode].items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
        },
      },
    }));
  },
  deleteBrainDumpBoardItem(mode: Mode, itemId: string) {
    setState((prev) => ({
      ...prev,
      brainDumpByMode: {
        ...prev.brainDumpByMode,
        [mode]: {
          ...prev.brainDumpByMode[mode],
          items: prev.brainDumpByMode[mode].items.filter((item) => item.id !== itemId),
        },
      },
    }));
  },
  setBrainDumpCamera(mode: Mode, camera: BrainDumpBoard["camera"]) {
    setState((prev) => ({
      ...prev,
      brainDumpByMode: {
        ...prev.brainDumpByMode,
        [mode]: {
          ...prev.brainDumpByMode[mode],
          camera,
        },
      },
    }));
  },
  setBrainDumpDoodle(mode: Mode, dataUrl: string | null) {
    setState((prev) => ({
      ...prev,
      brainDumpByMode: {
        ...prev.brainDumpByMode,
        [mode]: {
          ...prev.brainDumpByMode[mode],
          doodleDataUrl: dataUrl,
        },
      },
    }));
  },
};

export const axisStore = {
  getState: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function hydrateAxisStore() {
  const persisted = loadPersistedState();
  if (persisted) {
    const normalizedTasks =
      persisted.tasks?.map((task) => ({
        ...task,
        mode: task.mode ?? persisted.mode ?? "work",
        completed: task.completed ?? false,
        completedAt: task.completedAt ?? null,
      })) ?? [];
    const normalizedNotes: Record<string, DailyNotes> = {};
    Object.entries(persisted.notesByDay ?? {}).forEach(([key, value]) => {
      if (key.includes("_")) {
        normalizedNotes[key] = { ...defaultNotes, ...value };
      } else {
        normalizedNotes[`${key}_work`] = { ...defaultNotes, ...value };
      }
    });
    const normalizeBoard = (board?: BrainDumpBoard): BrainDumpBoard => ({
      items:
        board?.items?.map((item, index) => ({
          ...item,
          color: item.color ?? "lime",
          width: item.width ?? 240,
          height: item.height ?? 160,
          zIndex: item.zIndex ?? index + 1,
        })) ?? [],
      camera: board?.camera ?? { x: 0, y: 0, zoom: 1 },
      snapToGrid: board?.snapToGrid ?? false,
      gridSize: board?.gridSize ?? 24,
      doodleDataUrl: board?.doodleDataUrl ?? null,
    });
    const normalizedBrainDump: Record<Mode, BrainDumpBoard> = {
      work: normalizeBoard(persisted.brainDumpByMode?.work),
      home: normalizeBoard(persisted.brainDumpByMode?.home),
    };
    state = {
      ...state,
      ...persisted,
      tasks: normalizedTasks,
      notesByDay: normalizedNotes,
      brainDumpByMode: normalizedBrainDump,
    };
    notify();
  }
}

export function useAxisStore<T>(selector: (nextState: AxisState) => T) {
  return useSyncExternalStore(axisStore.subscribe, () => selector(state), () =>
    selector(state),
  );
}

export function AxisStoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrateAxisStore();
  }, []);

  return children;
}

export function useAxisActions() {
  return axisActions;
}

export function getCurrentSessionSafe(nextState: AxisState) {
  return getCurrentSession(nextState);
}
