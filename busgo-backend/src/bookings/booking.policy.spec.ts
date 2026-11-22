import type { PublicUser } from '../users/users.service.js';
import { BookingPolicy } from './booking.policy.js';

const user = (id: number, role: PublicUser['role'] = 'passenger') =>
  ({ id, role }) as PublicUser;

describe('BookingPolicy', () => {
  const policy = new BookingPolicy();
  const booking = { userId: 1 };

  it('lets passengers view only their own bookings', () => {
    expect(policy.view(user(1), booking)).toBe(true);
    expect(policy.view(user(2), booking)).toBe(false);
  });

  it('lets staff and admins view any booking', () => {
    expect(policy.view(user(9, 'staff'), booking)).toBe(true);
    expect(policy.view(user(9, 'admin'), booking)).toBe(true);
  });

  it('lets only the owner cancel', () => {
    expect(policy.cancel(user(1), booking)).toBe(true);
    expect(policy.cancel(user(2), booking)).toBe(false);
    expect(policy.cancel(user(9, 'admin'), booking)).toBe(false);
  });
});
