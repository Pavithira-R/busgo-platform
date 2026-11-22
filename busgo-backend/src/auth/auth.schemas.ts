import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .regex(/^\+?\d{9,15}$/, 'Phone must be 9-15 digits, optionally starting with +');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email().max(150),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
  phone: phone.optional(),
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
    phone: phone.nullable(),
    idNumber: z.string().trim().min(5).max(50).nullable(), // NIC or passport
  })
  .partial();
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
