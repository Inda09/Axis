export type Mode = "work" | "home";
export type SessionType = "focus" | "short_break" | "lunch" | "task_break";
export type SessionSource = "manual" | "auto_closed";
export type TaskPriority = "low" | "medium" | "high";

export type Session = {
  id: string;
  mode: Mode;
  type: SessionType;
  startTime: string;
  endTime: string | null;
  intendedMinutes: number;
  source: SessionSource;
};

export type BusyBlock = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
};

export type WorkSchedule = {
  dayOfWeek: number;
  start: string;
  end: string;
};

export type ModeSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  lunchMinutes: number;
  taskBreakMinutes: number;
};

export type AxisSettings = Record<Mode, ModeSettings>;

export type BrainDumpItem = {
  id: string;
  text: string;
  createdAt: string;
};

export type BrainDumpBoardItem = {
  id: string;
  type: "note" | "image";
  text?: string;
  imageDataUrl?: string;
  color: "lime" | "amber" | "blue" | "rose" | "slate";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt: string;
};

export type BrainDumpBoard = {
  items: BrainDumpBoardItem[];
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  snapToGrid: boolean;
  gridSize: number;
  doodleDataUrl: string | null;
};

export type Task = {
  id: string;
  title: string;
  mode: Mode;
  priority: TaskPriority;
  createdAt: string;
  deferredUntil: string | null;
};

export type DailyNotes = {
  meetingNotes: string;
  brainDump: string;
  brainDumpItems: BrainDumpItem[];
  doodleDataUrl: string | null;
};

export const DEFAULT_SETTINGS: AxisSettings = {
  work: {
    focusMinutes: 50,
    shortBreakMinutes: 10,
    lunchMinutes: 45,
    taskBreakMinutes: 5,
  },
  home: {
    focusMinutes: 50,
    shortBreakMinutes: 10,
    lunchMinutes: 45,
    taskBreakMinutes: 5,
  },
};

export const DEFAULT_WORK_SCHEDULE: WorkSchedule[] = [
  { dayOfWeek: 1, start: "09:00", end: "17:00" },
  { dayOfWeek: 2, start: "08:00", end: "18:00" },
  { dayOfWeek: 3, start: "08:30", end: "18:00" },
  { dayOfWeek: 4, start: "09:00", end: "13:00" },
  { dayOfWeek: 5, start: "09:00", end: "17:00" },
];
