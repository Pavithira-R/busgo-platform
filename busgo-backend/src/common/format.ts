import type { BusRoute } from '../db/schema.js';

/** Bus class names as Sri Lankan passengers know them. */
export const SERVICE_TYPE_LABELS: Record<BusRoute['serviceType'], string> = {
  normal: 'Normal',
  semi_luxury: 'Semi-Luxury',
  luxury: 'Luxury (A/C)',
  super_luxury: 'Super Luxury (A/C)',
};

/** "LKR 1,050.00" */
export function formatLkr(amount: number): string {
  return `LKR ${amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "Thu, 3 Dec 2026" for a YYYY-MM-DD date. */
export function formatTravelDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
