const LOG_KEY = "axis_error_log_v1";

export type ErrorLogEntry = {
  id: string;
  message: string;
  source?: string;
  stack?: string;
  time: string;
};

export function readErrorLog(): ErrorLogEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(LOG_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as ErrorLogEntry[];
  } catch {
    return [];
  }
}

export function writeErrorLog(entries: ErrorLogEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function appendErrorLog(entry: ErrorLogEntry) {
  const entries = readErrorLog();
  writeErrorLog([entry, ...entries].slice(0, 200));
}

export function clearErrorLog() {
  writeErrorLog([]);
}
