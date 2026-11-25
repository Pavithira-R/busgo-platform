import { isOvernight, ticketIdFromScan, travelWindow } from './scan-rules.js';

describe('ticketIdFromScan', () => {
  it('reads the ticket ID from a BusGo QR code', () => {
    const qr = JSON.stringify({ ticketId: 'BG-7K2M9QXA', seat: 'C1' });
    expect(ticketIdFromScan(qr)).toBe('BG-7K2M9QXA');
  });

  it('accepts a ticket ID typed by hand, in any case', () => {
    expect(ticketIdFromScan(' bg-7k2m9qxa ')).toBe('BG-7K2M9QXA');
  });

  it.each([
    'https://example.com/some-other-qr',
    '{"ticketId": 42}',
    '{not json',
    'BG-123',
    'BG-0OIL0OIL', // characters BusGo never uses
    '',
  ])('rejects %j', (code) => {
    expect(ticketIdFromScan(code)).toBeNull();
  });
});

describe('travelWindow', () => {
  it('is valid on the travel date', () => {
    expect(travelWindow('2026-12-03', '2026-12-03', false)).toBe('today');
  });

  it('is too early before the travel date', () => {
    expect(travelWindow('2026-12-03', '2026-12-02', false)).toBe('too_early');
  });

  it('expires after the travel date', () => {
    expect(travelWindow('2026-12-03', '2026-12-04', false)).toBe('expired');
  });

  it('keeps overnight tickets valid the next day', () => {
    expect(travelWindow('2026-12-03', '2026-12-04', true)).toBe('today');
    expect(travelWindow('2026-12-03', '2026-12-05', true)).toBe('expired');
  });
});

describe('isOvernight', () => {
  it('detects buses that arrive after midnight', () => {
    expect(isOvernight('21:00', '05:00')).toBe(true);
    expect(isOvernight('06:00', '09:30')).toBe(false);
  });
});
