"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AxisStoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toasts";
import { TimerEngine } from "@/components/timer-engine";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SpinningHalo } from "@/components/ui/spinning-halo";
import { ErrorLogListener } from "@/components/error-log-listener";
import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const desktopLinks = [
  { label: "Today", href: "/today" },
  { label: "Tasks", href: "/tasks" },
  { label: "Brain Dump", href: "/brain-dump" },
  { label: "Notes", href: "/notes" },
  { label: "Logs", href: "/logs" },
  { label: "Calls", href: "/calls" },
  { label: "Timeline", href: "/timeline" },
  { label: "Insights", href: "/insights" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`Supabase configured: ${isSupabaseConfigured}`);
    }
  }, []);

  return (
    <AxisStoreProvider>
      <ToastProvider>
        <ErrorLogListener />
        <TimerEngine />
        <div className="flex min-h-screen flex-col px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-10 sm:pb-10">
          <header className="mx-auto flex w-full max-w-[680px] items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-4 w-4 items-center justify-center">
                <SpinningHalo size={18} thickness={3} />
                <div className="relative z-10 h-2 w-2 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--text-0)]">
                {APP_NAME}
              </p>
            </div>
            <nav className="hidden items-center gap-6 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-2)] sm:flex">
              {desktopLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition hover:text-[var(--text-0)]",
                    pathname === link.href && "text-[var(--text-0)]",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="mx-auto mt-8 flex w-full max-w-[680px] flex-1 flex-col">
            <AnimatePresence mode="wait" initial={false}>
              <div key={pathname}>{children}</div>
            </AnimatePresence>
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </AxisStoreProvider>
  );
}
