"use client";

import { useEffect, useRef } from "react";
import { useAxisStore } from "@/lib/store";
import { isSameDay } from "@/lib/time";
import { getSessionLabel } from "@/lib/session-utils";

export function NotificationManager() {
    const { busyBlocks, tasks, mode, sessions, currentSessionId } = useAxisStore(
        (state) => state,
    );

    // Keep track of notified items to avoid spamming
    const notifiedRef = useRef<Set<string>>(new Set());

    // Request permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Check for busy blocks (calls/meetings)
    useEffect(() => {
        if (Notification.permission !== "granted") return;

        const interval = setInterval(() => {
            const now = new Date();
            const upcomingBlocks = busyBlocks.filter((block) => {
                const startTime = new Date(block.startTime);
                const diffValid = startTime.getTime() > now.getTime();
                const diffMinutes = (startTime.getTime() - now.getTime()) / 1000 / 60;
                return diffValid && diffMinutes <= 5 && diffMinutes > 4; // Notify 5 minutes before
            });

            upcomingBlocks.forEach((block) => {
                const key = `block-${block.id}`;
                if (!notifiedRef.current.has(key)) {
                    new Notification(`Upcoming: ${block.title}`, {
                        body: `Starting at ${new Date(block.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}`,
                        icon: "/favicon.ico",
                    });
                    notifiedRef.current.add(key);
                }
            });
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [busyBlocks]);

    // Check for tasks deferred until "now" (reminders) if we treat deferredUntil as a reminder time
    // For now, let's just use it for "session ending" notifications
    useEffect(() => {
        if (Notification.permission !== "granted") return;

        // Find current running session
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (!currentSession) return;

        const interval = setInterval(() => {
            const startTime = new Date(currentSession.startTime);
            const endTime = new Date(startTime.getTime() + currentSession.intendedMinutes * 60000);
            const now = new Date();

            // If session is done
            if (now >= endTime) {
                const key = `session-end-${currentSession.id}`;
                if (!notifiedRef.current.has(key)) {
                    new Notification(`${getSessionLabel(currentSession.type)} Finished`, {
                        body: "Time to take a break or switch tasks!",
                        icon: "/favicon.ico",
                    });
                    notifiedRef.current.add(key);
                }
            }
        }, 5000);

        return () => clearInterval(interval);

    }, [sessions, currentSessionId]);

    return null;
}
