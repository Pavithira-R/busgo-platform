import { z } from 'zod';
import { mobileSchema, nicSchema } from '../common/sri-lanka.js';
import { paymentMethod } from '../db/schema.js';
import { TICKET_ID_PATTERN } from './ticket-id.js';

/** Bookings open this many days ahead (Sri Lanka time). */
export const MAX_DAYS_AHEAD = 30;

export const createBookingSchema = z.object({
  routeId: z.number().int().positive(),
  travelDate: z.iso.date(),
  seatNumber: z.string().trim().toUpperCase().max(5),
  /** Omit to board at the route's starting bus stand. */
  boardingPointId: z.number().int().positive().optional(),
  passengerName: z.string().trim().min(2).max(100),
  passengerEmail: z.email().max(150),
  passengerPhone: mobileSchema,
  passengerIdNumber: nicSchema.optional(),
  /** Simulated payment: no real money is taken. */
  paymentMethod: z.enum(paymentMethod.enumValues),
});
export type CreateBookingDto = z.infer<typeof createBookingSchema>;

export const ticketIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(TICKET_ID_PATTERN, 'Ticket ID looks like BG-7K2M9QXA');
