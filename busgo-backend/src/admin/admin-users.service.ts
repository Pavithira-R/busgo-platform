import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, eq, inArray } from 'drizzle-orm';
import { hashPassword } from '../common/password.js';
import type { Database } from '../db/relations.js';
import { users } from '../db/schema.js';
import {
  type PublicUser,
  toPublicUser,
  UsersService,
} from '../users/users.service.js';
import type { CreateStaffDto, UserStatusDto } from './admin.schemas.js';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly usersService: UsersService,
  ) {}

  /** Gate staff and admins. */
  async staff(): Promise<(PublicUser & { isActive: boolean })[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(inArray(users.role, ['staff', 'admin']))
      .orderBy(asc(users.role), asc(users.fullName));
    return rows.map((u) => ({ ...toPublicUser(u), isActive: u.isActive }));
  }

  /** Creates a gate staff account (staff sign in with the normal login). */
  async createStaff(dto: CreateStaffDto): Promise<PublicUser> {
    const { password, ...rest } = dto;
    const user = await this.usersService.create({
      ...rest,
      passwordHash: await hashPassword(password),
      role: 'staff',
    });
    if (!user) throw new ConflictException('Email is already registered');
    return toPublicUser(user);
  }

  /**
   * Deactivates or reactivates a passenger or staff account. A deactivated
   * user can't sign in, and their current login stops working at once.
   */
  async setStatus(admin: PublicUser, id: number, dto: UserStatusDto) {
    if (id === admin.id) {
      throw new BadRequestException(
        'You cannot change your own account status',
      );
    }
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') {
      throw new ForbiddenException('Admin accounts cannot be deactivated here');
    }
    const [updated] = await this.db
      .update(users)
      .set({ isActive: dto.isActive })
      .where(eq(users.id, id))
      .returning();
    return { ...toPublicUser(updated), isActive: updated.isActive };
  }
}
