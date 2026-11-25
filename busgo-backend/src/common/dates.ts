/** Sri Lanka is UTC+05:30 all year (no daylight saving). */
const SRI_LANKA_OFFSET = '+05:30';

/** Today's date in Sri Lanka as YYYY-MM-DD, whatever the server's time zone. */
export function todayInSriLanka(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(
    now,
  );
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The exact moment of a Sri Lankan date + "HH:MM[:SS]" time. */
export function sriLankaDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time.slice(0, 5)}:00${SRI_LANKA_OFFSET}`);
}
