import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Signs login tokens. At least 32 characters: openssl rand -base64 32
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // How long a login token lasts, e.g. 15m, 1h, 1d
  JWT_TTL: z.string().default('1h'),
});

export type Env = z.infer<typeof envSchema>;
