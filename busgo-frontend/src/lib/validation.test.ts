import { isValidNic, mobile, nic, optional } from './validation';

describe('validation', () => {
  it('normalises Sri Lankan mobile numbers', () => {
    expect(mobile.parse('+94 77 123 4567')).toBe('0771234567');
    expect(mobile.parse('070-123-4567')).toBe('0701234567');
    expect(mobile.safeParse('0112345678').success).toBe(false); // landline
  });

  it('checks old and new NIC numbers', () => {
    expect(nic.parse('851234567v')).toBe('851234567V');
    expect(isValidNic('198512345678')).toBe(true);
    expect(isValidNic('198540012345')).toBe(false); // day 400
    expect(isValidNic('12345')).toBe(false);
  });

  it('treats an empty optional field as not given', () => {
    const optionalMobile = optional(mobile);
    expect(optionalMobile.parse('')).toBeUndefined();
    expect(optionalMobile.parse('0771234567')).toBe('0771234567');
    expect(optionalMobile.safeParse('123').success).toBe(false);
  });
});

describe('optional fields', () => {
  it('shows the real error message, not a generic one', () => {
    const result = optional(mobile).safeParse('0112345678');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('errors.mobile');
  });
});
