/** Adds minutes to a "HH:MM" (or "HH:MM:SS") time, wrapping past midnight. */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Minutes from departure to arrival ("HH:MM"), crossing midnight if needed. */
export function minutesBetween(departs: string, arrives: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const diff = toMin(arrives) - toMin(departs);
  return diff > 0 ? diff : diff + 24 * 60;
}
