import type { TFunction } from 'i18next';

/** Flat booking fee added to every ticket, in LKR (same as the backend). */
export const SERVICE_FEE = 100;

/** "LKR 1,050": digits stay Western in every language, as on Sri Lankan tickets. */
export function formatLkr(amount: number): string {
  return `LKR ${amount.toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
}

/** "3h 30m" in the UI language. */
export function formatDuration(t: TFunction, minutes: number) {
  return t('search.duration', {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  });
}

/** 1,284 / 12.9K: compact once numbers reach ten thousand. */
export function formatCompact(value: number) {
  return Math.abs(value) >= 10_000
    ? new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)
    : value.toLocaleString('en-LK');
}
