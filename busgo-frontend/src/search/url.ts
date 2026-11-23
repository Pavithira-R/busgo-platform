import { isBookableDate, todayInSriLanka } from '../lib/dates';

// Searches live in the URL (/search?from=CMB&to=KDY&date=2026-12-01), so
// results can be bookmarked, shared and reached with the back button.

export function searchUrl({
  from,
  to,
  date,
}: {
  from: string;
  to: string;
  date: string;
}) {
  return `/search?${new URLSearchParams({ from, to, date })}`;
}

export function routeUrl(routeId: number, date: string) {
  return `/routes/${routeId}?date=${date}`;
}

/** A date from the URL, or today when it is missing or can't be booked. */
export function dateParam(params: URLSearchParams): string {
  const date = params.get('date') ?? '';
  return isBookableDate(date) ? date : todayInSriLanka();
}
