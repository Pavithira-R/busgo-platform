import { todayInSriLanka } from './dates.js';

describe('todayInSriLanka', () => {
  it('uses Sri Lanka time (UTC+5:30), not UTC', () => {
    // 20:00 UTC on 1 Dec is already 01:30 on 2 Dec in Colombo.
    expect(todayInSriLanka(new Date('2026-12-01T20:00:00Z'))).toBe('2026-12-02');
    expect(todayInSriLanka(new Date('2026-12-01T10:00:00Z'))).toBe('2026-12-01');
  });
});
