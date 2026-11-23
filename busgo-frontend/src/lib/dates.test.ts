import {
  bookableDates,
  formatDate,
  hasDeparted,
  isBookableDate,
  todayInSriLanka,
} from './dates';

// 2026-12-01 20:00 UTC is already 2 December in Sri Lanka (01:30).
const lateEvening = new Date('2026-12-01T20:00:00Z');

describe('dates', () => {
  it('uses the Sri Lankan date, not the browser one', () => {
    expect(todayInSriLanka(lateEvening)).toBe('2026-12-02');
  });

  it('allows booking from today up to 30 days ahead', () => {
    const dates = bookableDates(lateEvening);
    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe('2026-12-02');
    expect(dates.at(-1)).toBe('2027-01-01');
    expect(isBookableDate('2027-01-01', lateEvening)).toBe(true);
    expect(isBookableDate('2027-01-02', lateEvening)).toBe(false);
    expect(isBookableDate('2026-12-01', lateEvening)).toBe(false);
    expect(isBookableDate('not-a-date', lateEvening)).toBe(false);
  });

  it('knows when a bus has left, in Sri Lanka time', () => {
    expect(hasDeparted('2026-12-02', '01:00', lateEvening)).toBe(true);
    expect(hasDeparted('2026-12-02', '06:00', lateEvening)).toBe(false);
  });

  it('formats dates in the chosen language', () => {
    expect(formatDate('2026-12-02', 'en')).toBe('Wed 2 Dec');
    expect(formatDate('2026-12-02', 'si')).not.toBe('Wed 2 Dec');
  });
});
