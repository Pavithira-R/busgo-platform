import type { PublicUser } from '../users/users.service.js';
import { RolePolicy } from './role.policy.js';

const user = (role: PublicUser['role']) => ({ role }) as PublicUser;

describe('RolePolicy', () => {
  const policy = new RolePolicy();

  it('admin: only admins', () => {
    expect(policy.admin(user('admin'))).toBe(true);
    expect(policy.admin(user('staff'))).toBe(false);
    expect(policy.admin(user('passenger'))).toBe(false);
    expect(policy.admin(null)).toBe(false);
  });

  it('staff: gate staff and admins', () => {
    expect(policy.staff(user('staff'))).toBe(true);
    expect(policy.staff(user('admin'))).toBe(true);
    expect(policy.staff(user('passenger'))).toBe(false);
    expect(policy.staff(null)).toBe(false);
  });
});
