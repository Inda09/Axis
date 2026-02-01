import type {
  BusyBlock,
  SessionType,
  WorkSchedule,
} from "@/lib/models";
import { MINUTE, parseTimeToMinutes } from "@/lib/time";

export type SuggestedSession = {
  type: SessionType;
  startTime: string;
  durationMinutes: number;
};

type TimeRange = { start: Date; end: Date };

export function getWorkDayRange(
  date: Date,
  schedule: WorkSchedule[],
): TimeRange | null {
  const match = schedule.find((item) => item.dayOfWeek === date.getDay());
  if (!match) {
    return null;
  }
  const startMinutes = parseTimeToMinutes(match.start);
  const endMinutes = parseTimeToMinutes(match.end);
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(startMinutes / 60),
    startMinutes % 60,
  );
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(endMinutes / 60),
    endMinutes % 60,
  );
  return { start, end };
}

export function isLunchRequired(plannedMinutes: number) {
  return plannedMinutes >= 360;
}

export function getShortBreakCount(plannedMinutes: number) {
  if (plannedMinutes >= 570) {
    return 3;
  }
  if (plannedMinutes >= 480) {
    return 2;
  }
  if (plannedMinutes >= 240) {
    return 1;
  }
  return 0;
}

const overlaps = (start: Date, end: Date, block: BusyBlock) => {
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);
  return start < blockEnd && end > blockStart;
};

const findAvailableTime = (
  target: Date,
  durationMinutes: number,
  busyBlocks: BusyBlock[],
  dayStart: Date,
  dayEnd: Date,
) => {
  const durationMs = durationMinutes * MINUTE;
  const isValid = (candidate: Date) => {
    const end = new Date(candidate.getTime() + durationMs);
    if (candidate < dayStart || end > dayEnd) {
      return false;
    }
    return !busyBlocks.some((block) => overlaps(candidate, end, block));
  };

  if (isValid(target)) {
    return target;
  }

  for (const offsetMinutes of [5, 10, 15, 20]) {
    const earlier = new Date(target.getTime() - offsetMinutes * MINUTE);
    if (isValid(earlier)) {
      return earlier;
    }
    const later = new Date(target.getTime() + offsetMinutes * MINUTE);
    if (isValid(later)) {
      return later;
    }
  }

  let candidate = target;
  const sortedBlocks = [...busyBlocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  for (const block of sortedBlocks) {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);
    const end = new Date(candidate.getTime() + durationMs);
    if (candidate < blockEnd && end > blockStart) {
      candidate = blockEnd;
    }
  }

  return isValid(candidate) ? candidate : null;
};

export function generateSuggestions({
  date,
  schedule,
  busyBlocks,
  shortBreakMinutes,
  lunchMinutes,
}: {
  date: Date;
  schedule: WorkSchedule[];
  busyBlocks: BusyBlock[];
  shortBreakMinutes: number;
  lunchMinutes: number;
}): SuggestedSession[] {
  const range = getWorkDayRange(date, schedule);
  if (!range) {
    return [];
  }
  const plannedMinutes = Math.round(
    (range.end.getTime() - range.start.getTime()) / MINUTE,
  );
  const suggestions: SuggestedSession[] = [];
  const shortBreakCount = getShortBreakCount(plannedMinutes);
  const lunchRequired = isLunchRequired(plannedMinutes);
  const shortBreakGapMinutes =
    shortBreakCount > 0 ? plannedMinutes / (shortBreakCount + 1) : 0;

  for (let index = 1; index <= shortBreakCount; index += 1) {
    const target = new Date(
      range.start.getTime() + shortBreakGapMinutes * index * MINUTE,
    );
    const adjusted = findAvailableTime(
      target,
      shortBreakMinutes,
      busyBlocks,
      range.start,
      range.end,
    );
    if (adjusted) {
      suggestions.push({
        type: "short_break",
        startTime: adjusted.toISOString(),
        durationMinutes: shortBreakMinutes,
      });
    }
  }

  if (lunchRequired) {
    const midpoint = new Date(
      range.start.getTime() + plannedMinutes * 0.5 * MINUTE,
    );
    const adjusted = findAvailableTime(
      midpoint,
      lunchMinutes,
      busyBlocks,
      range.start,
      range.end,
    );
    if (adjusted) {
      suggestions.push({
        type: "lunch",
        startTime: adjusted.toISOString(),
        durationMinutes: lunchMinutes,
      });
    }
  }

  return suggestions.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}
