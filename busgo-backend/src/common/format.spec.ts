import { formatLkr, formatTravelDate, SERVICE_TYPE_LABELS } from './format.js';

describe('format helpers', () => {
  it('formats rupees with thousands separators', () => {
    expect(formatLkr(1050)).toBe('LKR 1,050.00');
    expect(formatLkr(602.5)).toBe('LKR 602.50');
  });

  it('formats travel dates', () => {
    expect(formatTravelDate('2026-12-03')).toBe('Thu, 3 Dec 2026');
  });

  it('labels Sri Lankan bus classes', () => {
    expect(SERVICE_TYPE_LABELS.super_luxury).toBe('Super Luxury (A/C)');
  });
});
