"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAxisStore } from "@/lib/store";

const navItems = [
  { label: "Today", href: "/today" },
  { label: "Tasks", href: "/tasks" },
  { label: "Brain", href: "/brain-dump" },
  { label: "Notes", href: "/notes" },
  { label: "Calls", href: "/calls", workOnly: true },
  { label: "Timeline", href: "/timeline" },
  { label: "Insights", href: "/insights" },
];

export function BottomNav() {
  const pathname = usePathname();
  const mode = useAxisStore((state) => state.mode);
  const reduceMotion = useReducedMotion();

  return (
    <nav className="glass-panel no-scrollbar fixed bottom-5 left-1/2 z-40 flex w-[92%] -translate-x-1/2 items-center gap-6 overflow-x-auto rounded-full px-5 py-3 sm:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const isDisabled = item.workOnly && mode !== "work";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 text-[0.6rem] uppercase tracking-[0.28em]",
              isActive ? "text-[var(--text-0)]" : "text-[var(--text-2)]",
              isDisabled && "pointer-events-none opacity-30",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="nav-indicator"
                className="h-1.5 w-6 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }}
              />
            ) : (
              <span className="h-1.5 w-6 rounded-full bg-transparent" />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
