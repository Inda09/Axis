"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { DatePicker } from "@/components/ui/date-time-picker";
import { useAxisActions, useAxisStore } from "@/lib/store";
import { getDayKey } from "@/lib/time";

export default function NotesPage() {
  const { mode, notesByDay } = useAxisStore((state) => state);
  const actions = useAxisActions();
  const [selectedDate, setSelectedDate] = useState(() =>
    getDayKey(new Date()),
  );

  const dayKey = selectedDate;
  const key = `${dayKey}_${mode}`;
  const notes = useMemo(
    () =>
      notesByDay[key] ?? {
        meetingNotes: "",
        brainDump: "",
        brainDumpItems: [],
        doodleDataUrl: null,
      },
    [notesByDay, key],
  );


  return (
    <PageTransition>
      <StaggerContainer>
        <div className="flex flex-col gap-6">
          <StaggerItem>
            <ModeToggle value={mode} onChange={actions.setMode} />
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="flex flex-col gap-3">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Select Day
              </p>
              <DatePicker value={selectedDate} onChange={setSelectedDate} />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Meeting Notes
                </p>
                <textarea
                  value={notes.meetingNotes}
                  onChange={(event) =>
                    actions.updateNotes(dayKey, mode, {
                      meetingNotes: event.target.value,
                    })
                  }
                  rows={8}
                  placeholder="Key decisions, blockers, next steps."
                  className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-sm text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
                />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Brain Dump
                </p>
                <p className="text-sm text-[var(--text-2)]">
                  Brain Dump now lives on its own infinite board.
                </p>
                <a
                  href="/brain-dump"
                  className="glass-panel inline-flex w-fit items-center justify-between rounded-[var(--r-md)] px-4 py-3 text-sm font-semibold text-[var(--text-0)] transition hover:shadow-[var(--glow)]"
                >
                  Open Brain Dump
                </a>
              </div>
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="flex flex-col gap-3">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Doodle Pad
              </p>
              <p className="text-sm text-[var(--text-2)]">
                Use the Brain Dump board for sketches and pasted visuals.
              </p>
              <a
                href="/brain-dump"
                className="glass-panel inline-flex w-fit items-center justify-between rounded-[var(--r-md)] px-4 py-3 text-sm font-semibold text-[var(--text-0)] transition hover:shadow-[var(--glow)]"
              >
                Open Board
              </a>
            </GlassCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
