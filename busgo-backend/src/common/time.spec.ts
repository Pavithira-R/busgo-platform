import { addMinutes } from './time.js';

describe('addMinutes', () => {
  it('adds minutes within the day', () => {
    expect(addMinutes('06:00', 25)).toBe('06:25');
    expect(addMinutes('06:45:00', 90)).toBe('08:15');
  });

  it('wraps past midnight for night buses', () => {
    expect(addMinutes('21:00', 240)).toBe('01:00');
    expect(addMinutes('23:30', 30)).toBe('00:00');
  });
});
