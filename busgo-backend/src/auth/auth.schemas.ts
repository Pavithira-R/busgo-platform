import { z } from 'zod';
import { mobileSchema, nicSchema } from '../common/sri-lanka.js';

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email().max(150),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
  phone: mobileSchema.optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    phone: mobileSchema.nullable(),
    idNumber: nicSchema.nullable(),
  })
  .partial();
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
