"use client";

import { useEffect, useState } from "react";
import { TimerRing } from "@/components/timer-ring";

export function LandingHeroRing() {
  const [startTime, setStartTime] = useState<string | null>(null);

  useEffect(() => {
    setStartTime(new Date().toISOString());
  }, []);

  if (!startTime) {
    return null;
  }

  return (
    <TimerRing
      startTime={startTime}
      intendedMinutes={0}
      label="Axis"
      isRunning
      variant="ambient"
    />
  );
}
