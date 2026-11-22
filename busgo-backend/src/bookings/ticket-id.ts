import { randomInt } from 'node:crypto';

// No 0/O or 1/I/L, so ticket IDs are easy to read out over the phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A random ticket ID like BG-7K2M9QXA. */
export function generateTicketId(): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `BG-${code}`;
}

export const TICKET_ID_PATTERN = /^BG-[A-HJKMNP-Z2-9]{8}$/;
