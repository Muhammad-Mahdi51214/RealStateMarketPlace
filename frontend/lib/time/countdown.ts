/** Format remaining ms as HH:MM:SS (hours can exceed 24). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function remainingMs(expiresAt: string, now = Date.now()): number {
  return Math.max(0, new Date(expiresAt).getTime() - now);
}

export function formatReservedLabel(expiresAt: string, now = Date.now()): string {
  return `Reserved for ${formatCountdown(remainingMs(expiresAt, now))}`;
}
