"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useAxisActions, useAxisStore } from "@/lib/store";
import { formatDate, formatTime, fromLocalDateTimeInputValue, toLocalDateTimeInputValue } from "@/lib/time";
import type { BusyBlock } from "@/lib/models";

function BusyBlockItem({ block }: { block: BusyBlock }) {
  const actions = useAxisActions();
  const [title, setTitle] = useState(block.title);
  const [startTime, setStartTime] = useState(
    toLocalDateTimeInputValue(new Date(block.startTime)),
  );
  const [endTime, setEndTime] = useState(
    toLocalDateTimeInputValue(new Date(block.endTime)),
  );

  useEffect(() => {
    setTitle(block.title);
    setStartTime(toLocalDateTimeInputValue(new Date(block.startTime)));
    setEndTime(toLocalDateTimeInputValue(new Date(block.endTime)));
  }, [block]);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.65rem] text-[var(--text-2)]">
        <span>{formatDate(new Date(block.startTime))}</span>
        <span>
          {formatTime(new Date(block.startTime))}–{formatTime(new Date(block.endTime))}
        </span>
      </div>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-2 text-sm text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
        placeholder="Call title"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <DateTimePicker value={startTime} onChange={setStartTime} label="Start" />
        <DateTimePicker value={endTime} onChange={setEndTime} label="End" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <SecondaryButton
          type="button"
          onClick={() =>
            actions.updateBusyBlock(block.id, {
              title,
              startTime: fromLocalDateTimeInputValue(startTime),
              endTime: fromLocalDateTimeInputValue(endTime),
            })
          }
        >
          Save
        </SecondaryButton>
        <SecondaryButton
          type="button"
          className="text-[var(--text-1)]"
          onClick={() => actions.deleteBusyBlock(block.id)}
        >
          Delete
        </SecondaryButton>
      </div>
    </div>
  );
}

export default function CallsPage() {
  const { mode, busyBlocks } = useAxisStore((state) => state);
  const actions = useAxisActions();
  const now = new Date();
  const reduceMotion = useReducedMotion();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(toLocalDateTimeInputValue(now));
  const [endTime, setEndTime] = useState(
    toLocalDateTimeInputValue(new Date(now.getTime() + 30 * 60 * 1000)),
  );

  const sortedBlocks = useMemo(
    () =>
      [...busyBlocks].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [busyBlocks],
  );

  const addBusyBlock = () => {
    if (!title.trim()) {
      return;
    }
    const startIso = fromLocalDateTimeInputValue(startTime);
    const endIso = fromLocalDateTimeInputValue(endTime);
    if (new Date(endIso) <= new Date(startIso)) {
      return;
    }
    actions.addBusyBlock({
      title: title.trim(),
      startTime: startIso,
      endTime: endIso,
    });
    setTitle("");
  };

  if (mode !== "work") {
    return (
      <PageTransition>
        <StaggerContainer>
          <StaggerItem>
            <GlassCard>
              <p className="text-sm text-[var(--text-1)]">
                Calls are available in Work mode only.
              </p>
            </GlassCard>
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <StaggerContainer>
        <div className="flex flex-col gap-6">
          <StaggerItem>
            <GlassCard className="flex flex-col gap-4">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Add Busy Block
              </p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-sm text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <DateTimePicker value={startTime} onChange={setStartTime} label="Start" />
                <DateTimePicker value={endTime} onChange={setEndTime} label="End" />
              </div>
              <PrimaryButton type="button" onClick={addBusyBlock}>
                Add Call
              </PrimaryButton>
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <div className="flex flex-col gap-4">
              {sortedBlocks.length === 0 ? (
                <GlassCard>
                  <p className="text-sm text-[var(--text-2)]">No calls logged yet.</p>
                </GlassCard>
              ) : (
                <AnimatePresence initial={false}>
                  {sortedBlocks.map((block) => (
                    <motion.div
                      key={block.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                    >
                      <GlassCard>
                        <BusyBlockItem block={block} />
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
