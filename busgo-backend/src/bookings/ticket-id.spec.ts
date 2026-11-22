import { generateTicketId, TICKET_ID_PATTERN } from './ticket-id.js';

describe('generateTicketId', () => {
  it('creates readable IDs like BG-XXXXXXXX', () => {
    for (let i = 0; i < 200; i++) {
      const id = generateTicketId();
      expect(id).toMatch(TICKET_ID_PATTERN);
      expect(id.slice(3)).not.toMatch(/[01OIL]/);
    }
  });

  it('is practically unique', () => {
    const ids = new Set(Array.from({ length: 1000 }, generateTicketId));
    expect(ids.size).toBe(1000);
  });
});
