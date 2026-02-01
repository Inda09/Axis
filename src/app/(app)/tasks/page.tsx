"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PageTransition } from "@/components/page-transition";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { useAxisActions, useAxisStore } from "@/lib/store";

export default function TasksPage() {
  const { mode, tasks } = useAxisStore((state) => state);
  const actions = useAxisActions();
  const reduceMotion = useReducedMotion();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );

  const { activeTasks, delayedTasks } = useMemo(() => {
    const now = new Date();
    const filtered = tasks.filter((task) => task.mode === mode);
    return {
      activeTasks: filtered.filter(
        (task) => !task.deferredUntil || new Date(task.deferredUntil) <= now,
      ),
      delayedTasks: filtered.filter(
        (task) => task.deferredUntil && new Date(task.deferredUntil) > now,
      ),
    };
  }, [tasks, mode]);

  return (
    <PageTransition>
      <StaggerContainer>
        <div className="flex flex-col gap-6">
          <StaggerItem>
            <ModeToggle value={mode} onChange={actions.setMode} />
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="flex flex-col gap-4">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Tasks & Priorities
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Add a task"
                  className="flex-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-sm text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
                />
                <select
                  value={taskPriority}
                  onChange={(event) =>
                    setTaskPriority(event.target.value as "low" | "medium" | "high")
                  }
                  className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-sm text-[var(--text-1)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    if (!taskTitle.trim()) {
                      return;
                    }
                    actions.addTask(taskTitle.trim(), taskPriority, mode);
                    setTaskTitle("");
                  }}
                  className="sm:w-40"
                >
                  Add Task
                </PrimaryButton>
              </div>
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Swipe ← delete, → delay
              </p>
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="flex flex-col gap-3">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Active
              </p>
              {activeTasks.length === 0 ? (
                <p className="text-sm text-[var(--text-2)]">No active tasks.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {activeTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -80) {
                            actions.deleteTask(task.id);
                          } else if (info.offset.x > 80) {
                            actions.delayTask(task.id);
                          }
                        }}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.2,
                          ease: "easeOut",
                        }}
                        className="relative overflow-hidden rounded-[var(--r-md)]"
                      >
                        <div className="absolute inset-0 flex items-center justify-between px-4 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                          <span>Delay</span>
                          <span>Delete</span>
                        </div>
                        <div className="glass-panel relative z-10 flex items-center justify-between rounded-[var(--r-md)] px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[var(--text-0)]">
                              {task.title}
                            </span>
                            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                              {task.priority} priority
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="flex flex-col gap-3">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                Delayed
              </p>
              {delayedTasks.length === 0 ? (
                <p className="text-sm text-[var(--text-2)]">No delayed tasks.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {delayedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="glass-panel flex items-center justify-between rounded-[var(--r-md)] px-4 py-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-0)]">
                          {task.title}
                        </span>
                        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                          delayed until{" "}
                          {task.deferredUntil
                            ? new Date(task.deferredUntil).toLocaleDateString()
                            : "soon"}
                        </span>
                      </div>
                      <SecondaryButton
                        type="button"
                        className="w-auto px-4 py-2 text-[0.6rem]"
                        onClick={() => actions.deleteTask(task.id)}
                      >
                        Delete
                      </SecondaryButton>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
