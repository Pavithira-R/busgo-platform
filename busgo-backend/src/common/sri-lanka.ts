import { z } from 'zod';

/**
 * Sri Lankan mobile number: 07X XXX XXXX or +94 7X XXX XXXX.
 * Spaces and dashes are allowed; stored as 07XXXXXXXX.
 */
export const mobileSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine(
    (v) => /^(?:\+94|0)7\d{8}$/.test(v),
    'Enter a Sri Lankan mobile number, e.g. 0771234567 or +94771234567',
  )
  .transform((v) => (v.startsWith('+94') ? `0${v.slice(3)}` : v));

/**
 * National Identity Card number:
 * - old format: 9 digits + V or X (e.g. 851234567V)
 * - new format: 12 digits starting with the birth year (e.g. 198512345678)
 * Stored in upper case.
 */
export function isValidNic(value: string): boolean {
  if (/^\d{9}[VX]$/.test(value)) return true;
  if (!/^\d{12}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  // Digits 5-7 are the day of the year (+500 for women).
  const day = Number(value.slice(4, 7));
  const validDay = (day >= 1 && day <= 366) || (day >= 501 && day <= 866);
  return year >= 1900 && year <= new Date().getFullYear() && validDay;
}

export const nicSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isValidNic, 'Enter a valid NIC, e.g. 851234567V or 198512345678');
