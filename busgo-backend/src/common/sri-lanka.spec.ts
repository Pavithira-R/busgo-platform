import { isValidNic, mobileSchema, nicSchema } from './sri-lanka.js';

describe('mobileSchema', () => {
  it.each([
    ['0771234567', '0771234567'],
    ['+94771234567', '0771234567'],
    ['077 123 4567', '0771234567'],
    ['070-123-4567', '0701234567'],
  ])('accepts %s as %s', (input, stored) => {
    expect(mobileSchema.parse(input)).toBe(stored);
  });

  it.each(['0112345678', '771234567', '07712345678', '+9477123456', 'abc'])(
    'rejects %s',
    (input) => {
      expect(mobileSchema.safeParse(input).success).toBe(false);
    },
  );
});

describe('NIC', () => {
  it('accepts old-format NICs (9 digits + V/X)', () => {
    expect(isValidNic('851234567V')).toBe(true);
    expect(isValidNic('851234567X')).toBe(true);
    expect(nicSchema.parse(' 851234567v ')).toBe('851234567V');
  });

  it('accepts new-format NICs (12 digits, year + day of year)', () => {
    expect(isValidNic('198512345678')).toBe(true); // day 123, male
    expect(isValidNic('199575012345')).toBe(true); // day 750 = 250 + 500, female
  });

  it('rejects malformed NICs', () => {
    expect(isValidNic('85123456V')).toBe(false); // 8 digits
    expect(isValidNic('851234567Z')).toBe(false);
    expect(isValidNic('185012345678')).toBe(false); // year 1850
    expect(isValidNic('198540012345')).toBe(false); // day 400
    expect(isValidNic('19851234567')).toBe(false); // 11 digits
  });
});
