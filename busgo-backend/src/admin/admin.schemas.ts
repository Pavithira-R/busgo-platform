import { z } from 'zod';
import { mobileSchema } from '../common/sri-lanka.js';
import { bookingStatus, serviceType } from '../db/schema.js';

export const idParamSchema = z.coerce.number().int().positive();

// ---------- Operators ----------

export const createOperatorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  // Operators often list landlines (011…, 081…), so accept any 10 digits.
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, 'Phone must be 10 digits starting with 0')
    .or(mobileSchema)
    .optional(),
});
export type CreateOperatorDto = z.infer<typeof createOperatorSchema>;

export const updateOperatorSchema = createOperatorSchema
  .extend({ isActive: z.boolean() })
  .partial();
export type UpdateOperatorDto = z.infer<typeof updateOperatorSchema>;

// ---------- Routes ----------

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24-hour)');
const stopCode = z.string().trim().toUpperCase().min(2).max(10);

export const createRouteSchema = z
  .object({
    routeNumber: z.string().trim().min(1).max(20),
    operatorId: z.number().int().positive(),
    fromCode: stopCode,
    toCode: stopCode,
    departureTime: time,
    arrivalTime: time,
    price: z.number().positive().max(100_000), // LKR
    serviceType: z.enum(serviceType.enumValues),
    busNumber: z.string().trim().toUpperCase().max(20).optional(),
  })
  .refine((r) => r.fromCode !== r.toCode, {
    message: 'Start and end stops must be different',
    path: ['toCode'],
  });
export type CreateRouteDto = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = z
  .object({
    routeNumber: z.string().trim().min(1).max(20),
    operatorId: z.number().int().positive(),
    departureTime: time,
    arrivalTime: time,
    price: z.number().positive().max(100_000),
    serviceType: z.enum(serviceType.enumValues),
    busNumber: z.string().trim().toUpperCase().max(20).nullable(),
    isActive: z.boolean(),
  })
  .partial();
export type UpdateRouteDto = z.infer<typeof updateRouteSchema>;

export const routeListQuerySchema = z.object({
  operatorId: z.coerce.number().int().positive().optional(),
});
export type RouteListQuery = z.infer<typeof routeListQuerySchema>;

// ---------- Boarding points ----------

export const boardingPointsSchema = z.object({
  /** Towns in travel order. Include `id` to keep an existing point. */
  points: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        name: z.string().trim().min(2).max(100),
        minutesFromStart: z.number().int().positive(),
      }),
    )
    .max(30),
});
export type BoardingPointsDto = z.infer<typeof boardingPointsSchema>;

// ---------- Trip cancellation ----------

export const cancelTripSchema = z.object({
  travelDate: z.iso.date(),
  reason: z.string().trim().min(3).max(200),
});
export type CancelTripDto = z.infer<typeof cancelTripSchema>;

// ---------- Insights ----------

const date = z.iso.date();

export const dashboardQuerySchema = z
  .object({ from: date.optional(), to: date.optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be on or before "to"',
    path: ['from'],
  });
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const bookingListQuerySchema = z.object({
  status: z.enum(bookingStatus.enumValues).optional(),
  travelDate: date.optional(),
  routeId: z.coerce.number().int().positive().optional(),
  operatorId: z.coerce.number().int().positive().optional(),
  /** Ticket ID, passenger name, email or phone. */
  search: z.string().trim().min(2).max(100).optional(),
  ...pagination,
});
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;

export const userListQuerySchema = z.object({
  /** Name, email or phone. */
  search: z.string().trim().min(2).max(100).optional(),
  ...pagination,
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;
