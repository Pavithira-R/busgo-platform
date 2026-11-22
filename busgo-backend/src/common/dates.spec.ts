import { addDays, sriLankaDateTime, todayInSriLanka } from './dates.js';

describe('todayInSriLanka', () => {
  it('uses Sri Lanka time (UTC+5:30), not UTC', () => {
    // 20:00 UTC on 1 Dec is already 01:30 on 2 Dec in Colombo.
    expect(todayInSriLanka(new Date('2026-12-01T20:00:00Z'))).toBe(
      '2026-12-02',
    );
    expect(todayInSriLanka(new Date('2026-12-01T10:00:00Z'))).toBe(
      '2026-12-01',
    );
  });
});

describe('addDays', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-01', 30)).toBe('2026-12-31');
    expect(addDays('2026-12-15', 30)).toBe('2027-01-14');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
  });
});

describe('sriLankaDateTime', () => {
  it('interprets the time in Sri Lanka time', () => {
    expect(sriLankaDateTime('2026-12-01', '06:00:00').toISOString()).toBe(
      '2026-12-01T00:30:00.000Z',
    );
  });
});
