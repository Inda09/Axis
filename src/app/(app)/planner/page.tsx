"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/stagger";
import { useAxisStore, useAxisActions } from "@/lib/store";
import { formatTime, isSameDay } from "@/lib/time";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Modal } from "@/components/ui/modal";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { BusyBlock } from "@/lib/models";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PlannerPage() {
    const { mode, busyBlocks, tasks, workSchedule } = useAxisStore((state) => state);
    const actions = useAxisActions();
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [formData, setFormData] = useState<{
        title: string;
        startTime: string;
        endTime: string;
    }>({
        title: "",
        startTime: "",
        endTime: "",
    });

    const handleGridClick = (date: Date, hour: number) => {
        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(hour + 1, 0, 0, 0);

        // Format for datetime-local input (YYYY-MM-DDTHH:mm)
        const formatInput = (d: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setFormData({
            title: "",
            startTime: formatInput(start),
            endTime: formatInput(end),
        });
        setEditingBlockId(null);
        setIsModalOpen(true);
    };

    const handleBlockClick = (e: React.MouseEvent, block: BusyBlock) => {
        e.stopPropagation();
        // Format for datetime-local input
        const formatInput = (dStr: string) => {
            const d = new Date(dStr);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setFormData({
            title: block.title,
            startTime: formatInput(block.startTime),
            endTime: formatInput(block.endTime),
        });
        setEditingBlockId(block.id);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.startTime || !formData.endTime) return;

        if (editingBlockId) {
            actions.updateBusyBlock(editingBlockId, {
                title: formData.title,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
            });
        } else {
            actions.addBusyBlock({
                title: formData.title,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (editingBlockId) {
            actions.deleteBusyBlock(editingBlockId);
            setIsModalOpen(false);
        }
    };

    // Generate week days
    const weekDays = useMemo(() => {
        const dates = [];
        const curr = new Date(); // Start from today
        for (let i = 0; i < 7; i++) {
            const d = new Date(curr);
            d.setDate(curr.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, []);

    const timeSlots = useMemo(() => {
        let minStart = 24;
        let maxEnd = 0;

        // Calculate based on schedule if it exists
        if (workSchedule && workSchedule.length > 0) {
            workSchedule.forEach(sch => {
                const startHour = parseInt(sch.start.split(':')[0]);
                // If ends with :00, we count that hour as the boundary. 
                // e.g. 17:00 means we need to show 16:00-17:00 slot? 
                // No, if I work 9-17, I usually book 16:00-17:00 as last slot.
                // But if I have a meeting at 17:00-18:00? 
                // Let's ensure we cover the end time.
                const endHour = parseInt(sch.end.split(':')[0]) + (sch.end.endsWith('00') ? 0 : 1);

                if (startHour < minStart) minStart = startHour;
                if (endHour > maxEnd) maxEnd = endHour;
            });
        }

        // Apply defaults/constraints
        // Always show at least 08:00 to 18:00 (6 PM)
        minStart = Math.min(8, minStart);
        maxEnd = Math.max(18, maxEnd);

        // Safety clamps
        minStart = Math.max(0, minStart);
        maxEnd = Math.min(24, maxEnd);

        // Ensure valid range
        if (minStart >= maxEnd) {
            maxEnd = minStart + 1;
        }

        const slots = [];
        for (let i = minStart; i < maxEnd; i++) {
            slots.push(i);
        }
        return slots;
    }, [workSchedule]);

    return (
        <PageTransition>
            <StaggerContainer>
                <div className="flex flex-col gap-6">
                    <StaggerItem>
                        <div className="flex items-center justify-between">
                            <ModeToggle value={mode} onChange={actions.setMode} />
                            <h1 className="text-xl font-semibold text-[var(--text-0)]">Planner</h1>
                        </div>
                    </StaggerItem>

                    <StaggerItem>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-2)] mb-2">
                            <span>Schedule based on {workSchedule.length} configured working days.</span>
                        </div>
                    </StaggerItem>

                    <StaggerItem>
                        <GlassCard className="glass-panel-strong overflow-x-auto">
                            <div className="min-w-[800px] flex flex-col gap-4">
                                {/* Header */}
                                <div className="grid grid-cols-8 gap-2 border-b border-[var(--border)] pb-4">
                                    <div className="col-span-1 text-xs text-[var(--text-2)] uppercase tracking-wider pt-2">
                                        Time
                                    </div>
                                    {weekDays.map((date, i) => (
                                        <div key={i} className={`col-span-1 flex flex-col items-center gap-1 ${isSameDay(date, new Date()) ? "text-[var(--acc-0)]" : "text-[var(--text-1)]"}`}>
                                            <span className="text-xs font-semibold uppercase">{DAYS[date.getDay()]}</span>
                                            <span className="text-lg font-bold">{date.getDate()}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Grid */}
                                <div className="relative grid grid-cols-8 gap-2">
                                    {/* Time Labels */}
                                    <div className="col-span-1 flex flex-col pt-0">
                                        {timeSlots.map((hour, index) => (
                                            <div key={hour} className="h-12 text-xs text-[var(--text-2)] text-right pr-4 relative -top-2">
                                                {formatTime(new Date(new Date().setHours(hour, 0, 0, 0)))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Columns */}
                                    {weekDays.map((date, i) => {
                                        const dayTasks = tasks.filter(t => t.deferredUntil && isSameDay(new Date(t.deferredUntil), date) && !t.completed && t.mode === mode);
                                        const dayBlocks = busyBlocks.filter(b => isSameDay(new Date(b.startTime), date));

                                        return (
                                            <div key={i} className="col-span-1 relative border-l border-[var(--border)] bg-[rgba(255,255,255,0.02)]" style={{ height: `${timeSlots.length * 3}rem` }}>
                                                {/* Clickable Grid Background */}
                                                <div className="absolute inset-0 z-0 flex flex-col">
                                                    {timeSlots.map(hour => (
                                                        <div
                                                            key={hour}
                                                            className="h-12 border-b border-[var(--border)] border-opacity-20 hover:bg-[var(--glass)] cursor-pointer transition-colors"
                                                            onClick={() => handleGridClick(date, hour)}
                                                            title={`Add event at ${hour}:00`}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Render Busy Blocks */}
                                                {dayBlocks.map(block => {
                                                    const start = new Date(block.startTime);
                                                    const end = new Date(block.endTime);
                                                    const startHour = start.getHours() + start.getMinutes() / 60;
                                                    const endHour = end.getHours() + end.getMinutes() / 60;

                                                    const minVisible = timeSlots[0];
                                                    const maxVisible = timeSlots[timeSlots.length - 1] + 1;

                                                    if (endHour <= minVisible || startHour >= maxVisible) return null;

                                                    const top = (Math.max(startHour, minVisible) - minVisible) * 3 * 16;
                                                    const height = (Math.min(endHour, maxVisible) - Math.max(startHour, minVisible)) * 3 * 16;

                                                    return (
                                                        <div
                                                            key={block.id}
                                                            onClick={(e) => handleBlockClick(e, block)}
                                                            className="absolute z-10 w-[95%] left-[2.5%] rounded bg-[var(--acc-0)] bg-opacity-20 border border-[var(--acc-0)] text-[0.6rem] p-1 overflow-hidden cursor-pointer hover:bg-opacity-30 transition"
                                                            style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                                                        >
                                                            <div className="font-semibold text-[var(--text-0)] truncate">{block.title}</div>
                                                        </div>
                                                    )
                                                })}

                                                {/* Render Tasks */}
                                                <div className="absolute top-0 w-full flex flex-col gap-1 p-1 pointer-events-none">
                                                    {dayTasks.map(task => (
                                                        <div key={task.id} className="text-[0.6rem] bg-[var(--glass-2)] border border-[var(--border)] rounded px-1 py-0.5 truncate text-[var(--text-1)] pointer-events-auto">
                                                            {task.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </GlassCard>
                    </StaggerItem>
                </div>

                {/* Edit/Create Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingBlockId ? "Edit Event" : "New Event"}
                >
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-[var(--text-2)] uppercase tracking-wider">Title</label>
                            <input
                                className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-2 text-sm text-[var(--text-0)] outline-none focus:border-[var(--acc-0)]"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Meeting, Call, etc."
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-[var(--text-2)] uppercase tracking-wider">Start</label>
                                <input
                                    type="datetime-local"
                                    className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-2 py-2 text-xs text-[var(--text-0)] outline-none focus:border-[var(--acc-0)]"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-[var(--text-2)] uppercase tracking-wider">End</label>
                                <input
                                    type="datetime-local"
                                    className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-2 py-2 text-xs text-[var(--text-0)] outline-none focus:border-[var(--acc-0)]"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            {editingBlockId && (
                                <SecondaryButton type="button" onClick={handleDelete} className="text-red-400 hover:text-red-300">
                                    Delete
                                </SecondaryButton>
                            )}
                            <PrimaryButton type="submit">
                                {editingBlockId ? "Save Changes" : "Create Event"}
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>

            </StaggerContainer>
        </PageTransition>
    );
}
