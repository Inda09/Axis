"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAxisStore, useAxisActions } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { SecondaryButton } from "./ui/buttons";
import { TimerEngine } from "./timer-engine";
import { ErrorLogListener } from "./error-log-listener";
import { SpinningHalo } from "./ui/spinning-halo";
import { APP_NAME } from "@/lib/constants";

const desktopLinks = [
  { label: "Today", href: "/today" },
  { label: "Tasks", href: "/tasks" },
  { label: "Planner", href: "/planner" },
  { label: "Brain Dump", href: "/brain-dump" },
  { label: "Notes", href: "/notes" },
  { label: "Calls", href: "/calls" },
  { label: "Timeline", href: "/timeline" },
  { label: "Insights", href: "/insights" },
];

function WorkTimer() {
  const { currentShiftId, shifts } = useAxisStore(state => state);
  const actions = useAxisActions();
  const [elapsed, setElapsed] = useState(0);

  const currentShift = shifts?.find(s => s.id === currentShiftId);

  useEffect(() => {
    if (!currentShift) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(currentShift.startTime).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentShift]);

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (currentShiftId) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-[0.6rem] uppercase tracking-wider text-[var(--acc-0)]">Working</span>
          <span className="text-sm font-mono font-medium text-[var(--text-0)]">{formatDuration(elapsed)}</span>
        </div>
        <SecondaryButton onClick={actions.clockOut} className="h-8 text-xs border-red-500/30 text-red-400 hover:text-red-300">
          Finish Work
        </SecondaryButton>
      </div>
    )
  }

  return (
    <SecondaryButton onClick={actions.clockIn} className="h-8 text-xs">
      Start Work
    </SecondaryButton>
  )
}

export function DesktopAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <TimerEngine />
      <ErrorLogListener />
      <div className="flex h-screen w-full bg-[#050607] text-[var(--text-0)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[rgba(255,255,255,0.01)] backdrop-blur-xl">
          <div className="p-6 flex items-center gap-3">
            <div className="relative flex h-4 w-4 items-center justify-center">
              <SpinningHalo size={18} thickness={3} />
              <div className="relative z-10 h-2 w-2 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
            {desktopLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                    isActive
                      ? "text-[var(--text-0)]"
                      : "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--glass)]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-[var(--glass-2)] rounded-lg border border-[var(--border)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[var(--border)]">
            <Link href="/settings" className={cn("flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg", pathname === "/settings" ? "text-[var(--text-0)] bg-[var(--glass-2)] border border-[var(--border)]" : "text-[var(--text-2)] hover:text-[var(--text-0)]")}>
              Settings
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--border)] bg-[rgba(5,6,7,0.8)] backdrop-blur sticky top-0 z-40">
            <div className="flex-1"></div>
            <WorkTimer />
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-5xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const AppShell = DesktopAppShell;
