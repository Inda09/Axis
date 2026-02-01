"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { clearErrorLog, readErrorLog } from "@/lib/error-log";

export default function LogsPage() {
  const [copied, setCopied] = useState(false);
  const entries = useMemo(() => readErrorLog(), []);

  const copyAll = async () => {
    const payload = entries
      .map((entry) => `[${entry.time}] ${entry.message}\n${entry.stack ?? ""}`)
      .join("\n\n");
    await navigator.clipboard.writeText(payload || "No errors logged.");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <PageTransition>
      <StaggerContainer>
        <div className="flex flex-col gap-6">
          <StaggerItem>
            <GlassCard className="flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Error Log
                </p>
                <p className="text-sm text-[var(--text-1)]">
                  Copy and paste these logs when reporting issues.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SecondaryButton
                  type="button"
                  className="w-auto px-4 py-2 text-[0.6rem]"
                  onClick={() => {
                    clearErrorLog();
                    window.location.reload();
                  }}
                >
                  Clear
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  className="w-auto px-4 py-2 text-[0.6rem]"
                  onClick={copyAll}
                >
                  {copied ? "Copied" : "Copy All"}
                </PrimaryButton>
              </div>
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="flex flex-col gap-3">
              {entries.length === 0 ? (
                <p className="text-sm text-[var(--text-2)]">No errors yet.</p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-xs text-[var(--text-1)]"
                  >
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                      {entry.time}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-0)]">
                      {entry.message}
                    </p>
                    {entry.stack ? (
                      <pre className="mt-2 whitespace-pre-wrap text-[0.65rem] text-[var(--text-2)]">
                        {entry.stack}
                      </pre>
                    ) : null}
                  </div>
                ))
              )}
            </GlassCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
