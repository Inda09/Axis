"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel rounded-[var(--r-lg)] px-5 py-4 text-sm text-[var(--text-1)]",
        className,
      )}
      {...props}
    />
  );
}
