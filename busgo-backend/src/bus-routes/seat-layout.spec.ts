import {
  isValidSeat,
  layoutFor,
  seatCount,
  seatLabels,
} from './seat-layout.js';

describe('seat layout', () => {
  it.each([
    ['normal', 50, 'J5'],
    ['semi_luxury', 48, 'L4'],
    ['luxury', 40, 'J4'],
    ['super_luxury', 30, 'J3'],
  ] as const)('%s has %i seats ending at %s', (type, count, last) => {
    const labels = seatLabels(layoutFor(type));
    expect(labels).toHaveLength(count);
    expect(seatCount(type)).toBe(count);
    expect(labels[0]).toBe('A1');
    expect(labels.at(-1)).toBe(last);
  });

  it('validates seat labels for the bus type', () => {
    expect(isValidSeat('normal', 'A5')).toBe(true); // 2+3 rows have 5 seats
    expect(isValidSeat('luxury', 'A5')).toBe(false);
    expect(isValidSeat('super_luxury', 'A4')).toBe(false); // 2+1 rows have 3
    expect(isValidSeat('luxury', 'K1')).toBe(false); // only 10 rows
    expect(isValidSeat('semi_luxury', 'a1')).toBe(false);
  });
});
