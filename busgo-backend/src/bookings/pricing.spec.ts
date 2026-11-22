import { cancellationQuote, priceFor, SERVICE_FEE } from './pricing.js';

describe('priceFor', () => {
  it('adds the flat LKR 100 service fee', () => {
    expect(priceFor(2400)).toEqual({
      fare: 2400,
      serviceFee: 100,
      total: 2500,
    });
    expect(SERVICE_FEE).toBe(100);
  });
});

describe('cancellationQuote', () => {
  const departure = new Date('2026-12-20T15:30:00Z'); // 21:00 in Colombo
  const price = { fare: 2400, serviceFee: 100 };
  const hoursBefore = (h: number) =>
    new Date(departure.getTime() - h * 60 * 60 * 1000);

  it.each([
    // [hours before, %, processing fee, refund]
    [240, 5, 300, 1980], // 10 days
    [168.1, 5, 300, 1980], // just over 7 days
    [168, 10, 300, 1860], // exactly 7 days falls in "3 to 7 days"
    [120, 10, 300, 1860], // 5 days
    [72, 10, 300, 1860], // exactly 3 days
    [71.9, 12, 350, 1762],
    [48, 12, 350, 1762],
    [24, 12, 350, 1762], // exactly 24 hours
    [23.9, 15, 350, 1690],
    [6, 15, 350, 1690],
  ])(
    '%s hours before: %i%% + LKR %i → refund LKR %i',
    (h, pct, fee, refund) => {
      const q = cancellationQuote(price, departure, hoursBefore(h));
      expect(q).toMatchObject({
        canCancel: true,
        cancellationPercent: pct,
        processingFee: fee,
        refundAmount: refund,
        serviceFee: 100, // never refunded
      });
    },
  );

  it('cannot cancel after departure', () => {
    const q = cancellationQuote(price, departure, hoursBefore(-1));
    expect(q).toMatchObject({ canCancel: false, refundAmount: 0 });
    expect(q.reason).toMatch(/departed/);
  });

  it('never refunds a negative amount on cheap fares', () => {
    // LKR 150 fare: 15% (22.50) + 350 processing is more than the fare.
    const q = cancellationQuote(
      { fare: 150, serviceFee: 100 },
      departure,
      hoursBefore(2),
    );
    expect(q.refundAmount).toBe(0);
  });
});
