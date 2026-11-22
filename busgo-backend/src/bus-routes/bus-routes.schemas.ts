import { z } from 'zod';
import { todayInSriLanka } from '../common/dates.js';
import { serviceType } from '../db/schema.js';

const stopCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,10}$/, 'Stop code must be letters, e.g. CMB');

/** A travel date: YYYY-MM-DD, today or later (Sri Lanka time). */
const travelDate = z.iso
  .date()
  .refine((d) => d >= todayInSriLanka(), 'Date must be today or later');

export const searchRoutesSchema = z.object({
  from: stopCode.optional(),
  to: stopCode.optional(),
  serviceType: z.enum(serviceType.enumValues).optional(),
  operatorId: z.coerce.number().int().positive().optional(),
  /** When given, each route includes how many seats are free that day. */
  date: travelDate.optional(),
});
export type SearchRoutesQuery = z.infer<typeof searchRoutesSchema>;

export const routeIdSchema = z.coerce.number().int().positive();

export const seatsQuerySchema = z.object({ date: travelDate });
export type SeatsQuery = z.infer<typeof seatsQuerySchema>;
