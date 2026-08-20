"use client";

import { useEffect, useState } from "react";
import {
  formatCountdown,
  formatReservedLabel,
  remainingMs,
} from "@/lib/time/countdown";

/** Ticks every second while `expiresAt` is in the future. */
export function useCountdown(expiresAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) {
    return {
      now,
      ms: 0,
      label: "00:00:00",
      reservedLabel: "",
      expired: true,
    };
  }

  const ms = remainingMs(expiresAt, now);
  return {
    now,
    ms,
    label: formatCountdown(ms),
    reservedLabel: formatReservedLabel(expiresAt, now),
    expired: ms <= 0,
  };
}
