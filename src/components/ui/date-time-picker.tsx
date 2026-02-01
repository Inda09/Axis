"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (value: number) => String(value).padStart(2, "0");

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthShortLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const toMonthLabel = (date: Date) =>
  `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;

const toDisplayDate = (date: Date) =>
  `${pad(date.getDate())} ${monthShortLabels[date.getMonth()]} ${date.getFullYear()}`;

const toDisplayTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const toDateString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toDateTimeString = (date: Date) =>
  `${toDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

type CalendarProps = {
  selectedDate: Date;
  onSelect: (next: Date) => void;
};

function CalendarGrid({
  selectedDate,
  onSelect,
  reduceMotion,
}: CalendarProps & { reduceMotion: boolean }) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  useEffect(() => {
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = getDaysInMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    return Array.from({ length: 42 }, (_, index) => {
      const dayIndex = index - startOffset + 1;
      if (dayIndex < 1) {
        return new Date(year, month - 1, prevMonthDays + dayIndex);
      }
      if (dayIndex > daysInMonth) {
        return new Date(year, month + 1, dayIndex - daysInMonth);
      }
      return new Date(year, month, dayIndex);
    });
  }, [visibleMonth]);

  const today = new Date();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-0)]">
          {toMonthLabel(visibleMonth)}
        </p>
        <div className="flex items-center gap-2">
          <IconButton
            type="button"
            onClick={() =>
              setVisibleMonth(
                new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
              )
            }
          >
            ‹
          </IconButton>
          <IconButton
            type="button"
            onClick={() =>
              setVisibleMonth(
                new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
              )
            }
          >
            ›
          </IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-[var(--text-2)]">
        {weekdayLabels.map((label) => (
          <span key={label} className="text-center">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isSelected = toDateString(day) === toDateString(selectedDate);
          const isToday = toDateString(day) === toDateString(today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "group relative flex h-9 items-center justify-center rounded-[var(--r-sm)] text-xs transition",
                isCurrentMonth ? "text-[var(--text-0)]" : "text-[var(--text-2)]",
                isSelected
                  ? "border border-[var(--border-2)] bg-[var(--glass-2)] shadow-[var(--glow)]"
                  : "border border-transparent hover:border-[var(--border)] hover:bg-[var(--glass)]",
              )}
            >
              {!isSelected ? (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-[var(--r-sm)] opacity-0 group-hover:opacity-100"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgba(118,255,43,0), rgba(118,255,43,0.55), rgba(118,255,43,0))",
                    WebkitMask:
                      "radial-gradient(transparent 58%, black 64%, black 100%)",
                    mask: "radial-gradient(transparent 58%, black 64%, black 100%)",
                  }}
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { repeat: Infinity, duration: 2.2, ease: "linear" }
                  }
                />
              ) : null}
              <span className={isToday && !isSelected ? "text-[var(--acc-0)]" : ""}>
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type BasePickerProps = {
  label?: string;
  className?: string;
};

type DatePickerProps = BasePickerProps & {
  value: string;
  onChange: (value: string) => void;
};

export function DatePicker({ value, onChange, label, className }: DatePickerProps) {
  const reduceMotion = useReducedMotion();
  const reduceMotionFlag = !!reduceMotion;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const date = value ? new Date(value) : new Date();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inPopover = popoverRef.current?.contains(target);
      if (!inTrigger && !inPopover) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);
  useEffect(() => {
    if (!open) {
      return;
    }
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setPopoverStyle({
        top: rect.bottom + 12,
        left: rect.left,
        width: rect.width,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="glass-panel flex w-full items-center justify-between rounded-[var(--r-sm)] px-3 py-2 text-sm text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
      >
        <span>{toDisplayDate(date)}</span>
        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
          {label ?? "Date"}
        </span>
      </button>
      {portalTarget
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                  ref={popoverRef}
                  className="glass-panel-opaque fixed left-0 top-0 z-[999] w-[92%] max-w-sm rounded-[var(--r-lg)] p-4"
                  style={{
                    top: popoverStyle?.top ?? 0,
                    left: popoverStyle?.left ?? 0,
                    width: popoverStyle?.width ?? undefined,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-[var(--r-lg)]"
                    style={{
                      background:
                        "radial-gradient(180px 120px at 15% 0%, rgba(118,255,43,0.18), transparent 60%), radial-gradient(200px 140px at 90% 10%, rgba(118,255,43,0.12), transparent 70%)",
                    }}
                    animate={
                      reduceMotion
                        ? { opacity: 0.6 }
                        : { opacity: [0.4, 0.7, 0.4] }
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                  <div className="relative z-10">
            <CalendarGrid
                      selectedDate={date}
              reduceMotion={reduceMotionFlag}
                      onSelect={(next) => {
                        onChange(toDateString(next));
                        setOpen(false);
                      }}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            portalTarget,
          )
        : null}
    </div>
  );
}

type DateTimePickerProps = BasePickerProps & {
  value: string;
  onChange: (value: string) => void;
};

export function DateTimePicker({
  value,
  onChange,
  label,
  className,
}: DateTimePickerProps) {
  const reduceMotion = useReducedMotion();
  const reduceMotionFlag = !!reduceMotion;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const date = value ? new Date(value) : new Date();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inPopover = popoverRef.current?.contains(target);
      if (!inTrigger && !inPopover) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);
  useEffect(() => {
    if (!open) {
      return;
    }
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setPopoverStyle({
        top: rect.bottom + 12,
        left: rect.left,
        width: rect.width,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const hours = Array.from({ length: 24 }, (_, index) => pad(index));
  const minutes = Array.from({ length: 60 }, (_, index) => pad(index));

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="glass-panel flex w-full items-center justify-between rounded-[var(--r-sm)] px-3 py-2 text-sm text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
      >
        <span>{toDisplayDate(date)}</span>
        <span className="text-[0.7rem] text-[var(--text-2)]">{toDisplayTime(date)}</span>
      </button>
      {portalTarget
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                  ref={popoverRef}
                  className="glass-panel-opaque fixed left-0 top-0 z-[999] w-[92%] max-w-md rounded-[var(--r-lg)] p-4"
                  style={{
                    top: popoverStyle?.top ?? 0,
                    left: popoverStyle?.left ?? 0,
                    width: popoverStyle?.width ?? undefined,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-[var(--r-lg)]"
                    style={{
                      background:
                        "radial-gradient(200px 140px at 12% 0%, rgba(118,255,43,0.18), transparent 60%), radial-gradient(220px 160px at 88% 12%, rgba(118,255,43,0.12), transparent 70%)",
                    }}
                  animate={
                    reduceMotionFlag
                      ? { opacity: 0.6 }
                      : { opacity: [0.4, 0.7, 0.4] }
                  }
                  transition={
                    reduceMotionFlag
                      ? { duration: 0 }
                      : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                  }
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
                        {label ?? "Select Date"}
                      </p>
                      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 py-1 text-[0.65rem] text-[var(--text-1)]">
                        <span>Time</span>
                        <select
                          value={pad(date.getHours())}
                          onChange={(event) => {
                            const next = new Date(date);
                            next.setHours(Number(event.target.value));
                            onChange(toDateTimeString(next));
                          }}
                          className="bg-transparent text-[var(--text-0)] outline-none"
                        >
                          {hours.map((hour) => (
                            <option key={hour} value={hour}>
                              {hour}
                            </option>
                          ))}
                        </select>
                        <span>:</span>
                        <select
                          value={pad(date.getMinutes())}
                          onChange={(event) => {
                            const next = new Date(date);
                            next.setMinutes(Number(event.target.value));
                            onChange(toDateTimeString(next));
                          }}
                          className="bg-transparent text-[var(--text-0)] outline-none"
                        >
                          {minutes.map((minute) => (
                            <option key={minute} value={minute}>
                              {minute}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <CalendarGrid
                        selectedDate={date}
                        reduceMotion={reduceMotionFlag}
                        onSelect={(next) => {
                          const updated = new Date(date);
                          updated.setFullYear(
                            next.getFullYear(),
                            next.getMonth(),
                            next.getDate(),
                          );
                          onChange(toDateTimeString(updated));
                          setOpen(false);
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            portalTarget,
          )
        : null}
    </div>
  );
}
