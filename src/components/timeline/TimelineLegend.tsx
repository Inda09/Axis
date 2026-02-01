"use client";

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--acc-0)]" />
        Focus
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-white/40" />
        Break
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        Lunch
      </span>
    </div>
  );
}
