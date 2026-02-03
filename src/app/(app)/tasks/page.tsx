"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PageTransition } from "@/components/page-transition";
import { PrimaryButton, SecondaryButton, IconButton } from "@/components/ui/buttons";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { useAxisActions, useAxisStore } from "@/lib/store";
import { Play } from "lucide-react";

export default function TasksPage() {
  const { mode, tasks } = useAxisStore((state) => state);
  const actions = useAxisActions();
  const reduceMotion = useReducedMotion();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );

  const { activeTasks, delayedTasks, completedTasks } = useMemo(() => {
    const now = new Date();
    const filtered = tasks.filter((task) => task.mode === mode);
    return {
      activeTasks: filtered.filter(
        (task) =>
          !task.completed &&
          (!task.deferredUntil || new Date(task.deferredUntil) <= now),
      ),
      delayedTasks: filtered.filter(
        (task) =>
          !task.completed &&
          task.deferredUntil &&
          new Date(task.deferredUntil) > now,
      ),
      completedTasks: filtered
        .filter((task) => task.completed)
        .sort((a, b) => {
          const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return timeB - timeA; // Most recent first
        }),
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!taskTitle.trim()) return;
                      actions.addTask(taskTitle.trim(), taskPriority, mode);
                      setTaskTitle("");
                    }
                  }}
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
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.2,
                          ease: "easeOut",
                        }}
                      >
                        <div className="glass-panel relative z-10 flex items-center gap-3 rounded-[var(--r-md)] px-4 py-3 group">
                          <button
                            type="button"
                            onClick={() => actions.toggleTaskCompletion(task.id)}
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--text-2)] transition hover:border-[var(--acc-0)]"
                            aria-label="Mark completed"
                          />
                          <div className="flex flex-1 flex-col">
                            <span className="text-sm font-semibold text-[var(--text-0)]">
                              {task.title}
                            </span>
                            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                              {task.priority} priority
                            </span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton
                              className="h-8 w-8 !bg-[var(--glass-2)] hover:!bg-[var(--acc-0)] hover:text-black"
                              onClick={() => {
                                actions.startSession("focus", task.id);
                                // Redirect via simple location or router if I had it. 
                                // Since I don't have router in scope, I'll add useRouter hook above.
                                // Wait, I can't add hook here. I need to modify the whole component.
                                // I will modify the entire component return or just this block?
                                // I will use window.location.href or assume I can't use router without rewriting imports.
                                // Actually, I can use window.location.href = '/today' for now, or assume user stays.
                                // But user asked for feedback.
                                window.location.href = '/today';
                              }}
                              title="Start Focus Session"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </IconButton>
                            <SecondaryButton
                              className="w-auto h-8 px-3 py-0 text-[0.6rem]"
                              onClick={() => actions.delayTask(task.id)}
                            >
                              Delay
                            </SecondaryButton>
                            <SecondaryButton
                              className="w-auto h-8 px-3 py-0 text-[0.6rem] text-red-400 hover:text-red-300 border-red-500/30"
                              onClick={() => actions.deleteTask(task.id)}
                            >
                              Delete
                            </SecondaryButton>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </GlassCard>
          </StaggerItem>

          {/* Delayed Tasks */}
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
                      className="glass-panel flex items-center justify-between rounded-[var(--r-md)] px-4 py-3 opacity-70 group hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => actions.toggleTaskCompletion(task.id)}
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--text-2)] transition hover:border-[var(--acc-0)]"
                          aria-label="Mark completed"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[var(--text-0)]">
                            {task.title}
                          </span>
                          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                            until {task.deferredUntil ? new Date(task.deferredUntil).toLocaleDateString() : "future"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <SecondaryButton
                          type="button"
                          className="w-auto px-4 py-2 text-[0.6rem]"
                          onClick={() => actions.updateTask(task.id, { deferredUntil: null })}
                        >
                          Restore
                        </SecondaryButton>
                        <SecondaryButton
                          type="button"
                          className="w-auto px-4 py-2 text-[0.6rem]"
                          onClick={() => actions.toggleTaskCompletion(task.id)}
                        >
                          Complete
                        </SecondaryButton>
                        <SecondaryButton
                          type="button"
                          className="w-auto px-4 py-2 text-[0.6rem] text-red-400 hover:text-red-300 border-red-500/30"
                          onClick={() => actions.deleteTask(task.id)}
                        >
                          Delete
                        </SecondaryButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </StaggerItem>

          {completedTasks.length > 0 && (
            <StaggerItem>
              <GlassCard className="flex flex-col gap-3 opacity-60 transition-opacity hover:opacity-100">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                  Completed
                </p>
                <div className="flex flex-col gap-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="glass-panel flex items-center gap-3 rounded-[var(--r-md)] px-4 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => actions.toggleTaskCompletion(task.id)}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--acc-0)] bg-[var(--acc-0)] text-black"
                        aria-label="Mark incomplete"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-semibold text-[var(--text-0)] line-through opacity-50">
                          {task.title}
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
              </GlassCard>
            </StaggerItem>
          )}

        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
