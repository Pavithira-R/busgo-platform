/** Today's date in Sri Lanka as YYYY-MM-DD, whatever the server's time zone. */
export function todayInSriLanka(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(
    now,
  );
}
