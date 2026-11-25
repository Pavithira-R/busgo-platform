import { z } from 'zod';

// Same rules as the backend (src/common/sri-lanka.ts), so people see
// mistakes before submitting. Messages are translation keys.

/** 07X XXX XXXX or +94 7X XXX XXXX; spaces and dashes allowed. Returns 07XXXXXXXX. */
export const mobile = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => /^(?:\+94|0)7\d{8}$/.test(v), 'errors.mobile')
  .transform((v) => (v.startsWith('+94') ? `0${v.slice(3)}` : v));

export function isValidNic(value: string): boolean {
  if (/^\d{9}[VX]$/.test(value)) return true;
  if (!/^\d{12}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const day = Number(value.slice(4, 7));
  const validDay = (day >= 1 && day <= 366) || (day >= 501 && day <= 866);
  return year >= 1900 && year <= new Date().getFullYear() && validDay;
}

/** Old (851234567V) or new (198512345678) NIC. Returns it in upper case. */
export const nic = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isValidNic, 'errors.nic');

export const email = z
  .string()
  .trim()
  .min(1, 'errors.required')
  .email('errors.email');
export const password = z.string().min(8, 'errors.passwordMin').max(100);
export const fullName = z.string().trim().min(2, 'errors.nameMin').max(100);

/**
 * An optional text field: empty input counts as "not given", anything else
 * must pass `schema` (and shows its error message, not a generic one).
 */
export function optional<T extends z.ZodTypeAny>(schema: T) {
  return z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(schema.optional());
}

// Demo card checks: the details are only checked in the browser, never sent.

function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

/** 16 digits (spaces allowed) that pass the standard card checksum. */
export const cardNumber = z
  .string()
  .transform((v) => v.replace(/\s/g, ''))
  .refine((v) => /^\d{16}$/.test(v) && passesLuhn(v), 'errors.cardNumber');

/** MM/YY, not before this month. */
export const cardExpiry = z.string().refine((v) => {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.trim());
  if (!match) return false;
  const now = new Date();
  const year = 2000 + Number(match[2]);
  const month = Number(match[1]);
  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1)
  );
}, 'errors.cardExpiry');

export const cardCvv = z.string().regex(/^\d{3}$/, 'errors.cardCvv');
