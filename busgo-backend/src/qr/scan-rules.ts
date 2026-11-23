import { addDays } from '../common/dates.js';
import { TICKET_ID_PATTERN } from '../bookings/ticket-id.js';

/**
 * Gets the ticket ID from whatever the scanner read: the JSON stored in a
 * BusGo QR code, or a ticket ID typed in by hand. Returns null for anything
 * that isn't a BusGo ticket.
 */
export function ticketIdFromScan(code: string): string | null {
  const text = code.trim();
  let candidate = text;
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as { ticketId?: unknown };
      candidate = typeof parsed.ticketId === 'string' ? parsed.ticketId : '';
    } catch {
      return null;
    }
  }
  const ticketId = candidate.trim().toUpperCase();
  return TICKET_ID_PATTERN.test(ticketId) ? ticketId : null;
}

export type TravelWindow = 'today' | 'too_early' | 'expired';

/**
 * Whether a ticket can be used on `today` (both YYYY-MM-DD, Sri Lanka time).
 * Valid on the travel date. Overnight buses (arriving after midnight) stay
 * valid the next day too, for passengers boarding at towns after midnight.
 */
export function travelWindow(
  travelDate: string,
  today: string,
  overnight: boolean,
): TravelWindow {
  if (today < travelDate) return 'too_early';
  if (today === travelDate) return 'today';
  if (overnight && today === addDays(travelDate, 1)) return 'today';
  return 'expired';
}

/** A bus that arrives "earlier" than it departs crosses midnight. */
export function isOvernight(departureTime: string, arrivalTime: string) {
  return arrivalTime < departureTime;
}
