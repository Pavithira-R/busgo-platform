import { z } from 'zod';

export const validateScanSchema = z.object({
  /** Exactly what the scanner read (QR text), or a ticket ID typed in. */
  code: z.string().max(2000),
  /** Where the scan happened, e.g. "Colombo - Gate 3". */
  location: z.string().trim().min(1).max(100).optional(),
});
export type ValidateScanDto = z.infer<typeof validateScanSchema>;
