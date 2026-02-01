"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PageTransition } from "@/components/page-transition";
import { PrimaryButton } from "@/components/ui/buttons";
import { useAxisActions, useAxisStore } from "@/lib/store";
import { formatDate, formatTime, getDayKey } from "@/lib/time";

export default function BrainDumpPage() {
  const { mode, notesByDay } = useAxisStore((state) => state);
  const actions = useAxisActions();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState("");

  const dayKey = getDayKey(new Date());
  const notesKey = `${dayKey}_${mode}`;
  const entries = useMemo(() => {
    const items = notesByDay[notesKey]?.brainDumpItems ?? [];
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notesByDay, notesKey]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const submitEntry = () => {
    const next = text.trim();
    if (!next) {
      return;
    }
    actions.addBrainDumpItem(dayKey, mode, next);
    setText("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-screen w-full max-w-[1000px] flex-col px-6 pb-20 pt-6">
        <header className="sticky top-0 z-10 -mx-6 mb-6 border-b border-[var(--border)] bg-[var(--bg-0)]/85 px-6 pb-4 pt-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold text-[var(--text-0)]">Brain Dump</p>
              <p className="text-sm text-[var(--text-2)]">Get it out of your head</p>
            </div>
            <ModeToggle value={mode} onChange={actions.setMode} />
          </div>
        </header>

        <GlassCard className="glass-panel-strong flex flex-col gap-4 p-6">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                submitEntry();
              }
            }}
            placeholder="Write what is on your mind…"
            rows={6}
            className="w-full resize-none rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--glass)] px-4 py-4 text-base text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
            <span>Cmd + Enter to add</span>
            <PrimaryButton type="button" className="w-auto px-6 py-3" onClick={submitEntry}>
              Add entry
            </PrimaryButton>
          </div>
        </GlassCard>

        <div className="mt-8 flex flex-col gap-4">
          {entries.length === 0 ? (
            <GlassCard className="glass-panel flex items-center justify-center px-6 py-10 text-sm text-[var(--text-2)]">
              No entries yet. Start dumping thoughts above.
            </GlassCard>
          ) : (
            entries.map((entry) => {
              const createdAt = new Date(entry.createdAt);
              return (
                <GlassCard key={entry.id} className="glass-panel-strong px-6 py-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                      {formatDate(createdAt)} · {formatTime(createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => actions.deleteBrainDumpItem(dayKey, mode, entry.id)}
                      className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)] transition hover:text-[var(--text-0)]"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-base text-[var(--text-0)]">
                    {entry.text}
                  </p>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>
    </PageTransition>
  );
}
