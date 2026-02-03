"use client";

import { useMemo } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { useAxisStore, useAxisActions } from "@/lib/store";
import { WorkSchedule } from "@/lib/models";
import { SecondaryButton } from "@/components/ui/buttons";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsPage() {
    const { workSchedule } = useAxisStore((state) => state);
    const actions = useAxisActions();

    // Helper to find schedule for a day or return undefined
    const getSchedule = (dayIndex: number) => {
        return workSchedule.find(s => s.dayOfWeek === dayIndex);
    };

    const handleToggleDay = (dayIndex: number, enabled: boolean) => {
        if (enabled) {
            // Add default if adding
            const newSchedule = [...workSchedule, { dayOfWeek: dayIndex, start: "09:00", end: "17:00" }];
            actions.setWorkSchedule(newSchedule);
        } else {
            // Remove
            const newSchedule = workSchedule.filter(s => s.dayOfWeek !== dayIndex);
            actions.setWorkSchedule(newSchedule);
        }
    }

    const handleUpdate = (dayIndex: number, field: "start" | "end", value: string) => {
        const current = getSchedule(dayIndex);
        if (!current) return;

        const updated = { ...current, [field]: value };
        const newSchedule = workSchedule.filter(s => s.dayOfWeek !== dayIndex);
        newSchedule.push(updated);
        actions.setWorkSchedule(newSchedule);
    };

    return (
        <PageTransition>
            <StaggerContainer>
                <div className="flex flex-col gap-6">
                    <StaggerItem>
                        <h1 className="text-xl font-semibold text-[var(--text-0)]">Settings</h1>
                    </StaggerItem>

                    <StaggerItem>
                        <GlassCard className="glass-panel-strong flex flex-col gap-6">
                            <div className="border-b border-[var(--border)] pb-2 mb-2">
                                <h2 className="text-lg font-medium text-[var(--text-0)]">Work Schedule</h2>
                                <p className="text-sm text-[var(--text-1)]">Configure your working days and hours.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {DAYS.map((dayName, index) => {
                                    const schedule = getSchedule(index);
                                    const isEnabled = !!schedule;

                                    return (
                                        <div key={index} className={`flex flex-col gap-2 p-3 rounded-[var(--r-sm)] border border-[var(--border)] transition-colors ${isEnabled ? 'bg-[var(--glass)]' : 'opacity-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-[var(--text-1)]">{dayName}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={isEnabled}
                                                    onChange={(e) => handleToggleDay(index, e.target.checked)}
                                                    className="accent-[var(--acc-0)] h-4 w-4"
                                                />
                                            </div>
                                            {isEnabled && schedule && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        type="time"
                                                        className="bg-transparent text-xs text-[var(--text-0)] outline-none border border-[var(--border)] rounded px-2 py-1 focus:border-[var(--acc-0)]"
                                                        value={schedule.start}
                                                        onChange={(e) => handleUpdate(index, "start", e.target.value)}
                                                    />
                                                    <span className="text-[var(--text-2)]">-</span>
                                                    <input
                                                        type="time"
                                                        className="bg-transparent text-xs text-[var(--text-0)] outline-none border border-[var(--border)] rounded px-2 py-1 focus:border-[var(--acc-0)]"
                                                        value={schedule.end}
                                                        onChange={(e) => handleUpdate(index, "end", e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </StaggerItem>

                    <StaggerItem>
                        <GlassCard className="flex flex-col gap-4">
                            <div className="border-b border-[var(--border)] pb-2">
                                <h2 className="text-lg font-medium text-[var(--text-0)]">System Logs</h2>
                                <p className="text-sm text-[var(--text-1)]">View error logs for troubleshooting.</p>
                            </div>
                            <div>
                                <Link href="/logs">
                                    <SecondaryButton className="w-auto">View Error Logs</SecondaryButton>
                                </Link>
                            </div>
                        </GlassCard>
                    </StaggerItem>
                </div>
            </StaggerContainer>
        </PageTransition>
    );
}
