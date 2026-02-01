"use client";

import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

type TimeRailProps = {
  height: number;
  rangeStart: number;
  rangeEnd: number;
  nowMinute?: number | null;
};

const hours = Array.from({ length: 25 }, (_, index) => index);

export function TimeRail({ height, rangeStart, rangeEnd, nowMinute }: TimeRailProps) {
  const span = rangeEnd - rangeStart;
  const minuteToOffset = (minute: number) =>
    ((minute - rangeStart) / span) * height;

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-5 top-0 h-full w-px bg-white/10" />
      {hours.map((hour) => {
        const minute = hour * 60;
        if (minute < rangeStart || minute > rangeEnd) {
          return null;
        }
        const top = minuteToOffset(minute);
        return (
          <div key={hour} className="absolute left-0 w-12" style={{ top }}>
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--text-2)]">
                {formatTime(new Date(0, 0, 0, hour, 0))}
              </span>
              <span className="h-px w-3 bg-white/10" />
            </div>
          </div>
        );
      })}
      {hours.map((hour) => {
        const minute = hour * 60 + 30;
        if (minute < rangeStart || minute > rangeEnd) {
          return null;
        }
        const top = minuteToOffset(minute);
        return (
          <div key={`half-${hour}`} className="absolute left-5 w-3" style={{ top }}>
            <span className="h-px w-2 bg-white/5 block" />
          </div>
        );
      })}
      {nowMinute != null && nowMinute >= rangeStart && nowMinute <= rangeEnd ? (
        <div className="absolute left-0 right-0" style={{ top: minuteToOffset(nowMinute) }}>
          <div className="relative ml-5 h-px bg-[var(--acc-0)]/50">
            <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]" />
          </div>
        </div>
      ) : null}
      <div className={cn("absolute left-0 top-0 h-full w-full")} />
    </div>
  );
}
