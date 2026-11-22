import { Policy } from '@nestjs/authorization';
import type { PublicUser } from '../users/users.service.js';

/**
 * Role-based access. Use on routes:
 *   @Can(RolePolicy, 'admin')   admins only
 *   @Can(RolePolicy, 'staff')   gate staff and admins
 */
@Policy()
export class RolePolicy {
  admin(user: PublicUser | null): boolean {
    return user?.role === 'admin';
  }

  staff(user: PublicUser | null): boolean {
    return user?.role === 'staff' || user?.role === 'admin';
  }
}
