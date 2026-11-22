import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/relations.js';
import { type NewUser, type User, users } from '../db/schema.js';

/** A user as the API exposes it: never includes the password hash. */
export type PublicUser = Omit<User, 'passwordHash' | 'isActive'>;

export type ProfileUpdate = Partial<
  Pick<User, 'fullName' | 'phone' | 'idNumber'>
>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _hash, isActive: _active, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findActiveById(id: number): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.isActive, true)));
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  /** Returns undefined when the email is already registered. */
  async create(input: NewUser): Promise<User | undefined> {
    const [user] = await this.db
      .insert(users)
      .values({ ...input, email: input.email.toLowerCase() })
      .onConflictDoNothing({ target: users.email })
      .returning();
    return user;
  }

  /** Returns undefined if the user doesn't exist. */
  async updateProfile(
    id: number,
    changes: ProfileUpdate,
  ): Promise<User | undefined> {
    // Nothing to change (e.g. only disallowed fields were sent): skip the
    // UPDATE, which would fail with an empty SET.
    if (Object.keys(changes).length === 0) return this.findActiveById(id);

    const [user] = await this.db
      .update(users)
      .set(changes)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}
