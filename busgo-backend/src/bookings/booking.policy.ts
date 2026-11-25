import { Policy } from '@nestjs/authorization';
import type { Booking } from '../db/schema.js';
import type { PublicUser } from '../users/users.service.js';

const isStaff = (user: PublicUser) =>
  user.role === 'staff' || user.role === 'admin';

@Policy()
export class BookingPolicy {
  /** Passengers see their own tickets; gate staff and admins see any. */
  view(user: PublicUser, booking: Pick<Booking, 'userId'>): boolean {
    return booking.userId === user.id || isStaff(user);
  }

  /** Only the passenger who booked can cancel. */
  cancel(user: PublicUser, booking: Pick<Booking, 'userId'>): boolean {
    return booking.userId === user.id;
  }
}
