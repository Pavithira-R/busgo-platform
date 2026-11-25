import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  JwtBearerProvider,
  type JwtClaims,
} from '@nestjs/authentication';
import {
  type PublicUser,
  toPublicUser,
  UsersService,
} from '../users/users.service.js';

/** Reads "Authorization: Bearer <token>" and loads the signed-in user. */
@Injectable()
export class JwtAuthProvider extends JwtBearerProvider<PublicUser> {
  constructor(
    private readonly usersService: UsersService,
    registry: AuthenticationRegistry,
  ) {
    super({ realm: 'busgo' });
    registry.registerProvider(this, { order: 1 });
  }

  protected async validate({ sub }: JwtClaims): Promise<PublicUser | null> {
    const id = Number(sub);
    if (!Number.isInteger(id)) return null;
    // Deactivated users are rejected even if their token hasn't expired.
    const user = await this.usersService.findActiveById(id);
    return user ? toPublicUser(user) : null;
  }
}
