// Dates are plain YYYY-MM-DD strings in Sri Lanka time (UTC+05:30, no
// daylight saving), the same as the backend, whatever the browser's zone.

/** Bookings open this many days before travel (same as the backend). */
export const MAX_DAYS_AHEAD = 30;

/** Today's date in Sri Lanka as YYYY-MM-DD. */
export function todayInSriLanka(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(
    now,
  );
}

/** The Sri Lankan date of a server timestamp (ISO, or "2026-11-23 22:10:08+05:30"). */
export function dateInSriLanka(timestamp: string): string {
  return todayInSriLanka(new Date(timestamp.replace(' ', 'T')));
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The last date that can be booked today. */
export function lastBookableDate(now?: Date): string {
  return addDays(todayInSriLanka(now), MAX_DAYS_AHEAD);
}

/** Every bookable date, from today to {@link lastBookableDate}. */
export function bookableDates(now?: Date): string[] {
  const today = todayInSriLanka(now);
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) =>
    addDays(today, i),
  );
}

export function isBookableDate(date: string, now?: Date): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    date >= todayInSriLanka(now) &&
    date <= lastBookableDate(now)
  );
}

/** Whether a bus leaving at "HH:MM" on `date` (Sri Lanka time) has left. */
export function hasDeparted(date: string, time: string, now = new Date()) {
  return new Date(`${date}T${time}:00+05:30`) <= now;
}

const LOCALES: Record<string, string> = {
  // British order ("Wed 2 Dec"), as dates are written in Sri Lanka.
  en: 'en-GB',
  si: 'si-LK',
  ta: 'ta-LK',
};

/** Formats a YYYY-MM-DD date in the UI language, e.g. "Wed 25 Nov". */
export function formatDate(
  date: string,
  language: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  },
): string {
  return new Intl.DateTimeFormat(LOCALES[language] ?? 'en-GB', {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
