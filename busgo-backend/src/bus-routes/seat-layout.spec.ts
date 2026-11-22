import { isValidSeat, layoutFor, seatLabels } from './seat-layout.js';

describe('seat layout', () => {
  it.each([
    ['standard', 48, 'L4'],
    ['semi_luxury', 40, 'J4'],
    ['luxury', 24, 'H3'],
  ] as const)('%s has %i seats ending at %s', (type, count, last) => {
    const labels = seatLabels(layoutFor(type));
    expect(labels).toHaveLength(count);
    expect(labels[0]).toBe('A1');
    expect(labels.at(-1)).toBe(last);
  });

  it('validates seat labels for the bus type', () => {
    expect(isValidSeat('standard', 'A4')).toBe(true);
    expect(isValidSeat('luxury', 'A4')).toBe(false); // luxury rows have 3 seats
    expect(isValidSeat('semi_luxury', 'K1')).toBe(false); // only 10 rows
    expect(isValidSeat('standard', 'a1')).toBe(false);
  });
});
