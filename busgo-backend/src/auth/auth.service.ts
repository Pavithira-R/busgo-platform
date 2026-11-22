import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '@nestjs/authentication';
import { hashPassword, verifyPassword } from '../common/password.js';
import type { User } from '../db/schema.js';
import {
  type PublicUser,
  toPublicUser,
  UsersService,
} from '../users/users.service.js';
import type { LoginDto, RegisterDto } from './auth.schemas.js';

export interface AuthResponse {
  accessToken: string;
  expiresIn: number; // seconds
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResponse> {
    const { password, ...rest } = input;
    const user = await this.usersService.create({
      ...rest,
      passwordHash: await hashPassword(password),
      role: 'passenger', // public sign-up can never create staff or admins
    });
    if (!user) throw new ConflictException('Email is already registered');
    return this.signIn(user);
  }

  async login({ email, password }: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);
    // Same error for unknown email and wrong password, so attackers
    // can't discover which emails are registered.
    const valid =
      user?.isActive && (await verifyPassword(password, user.passwordHash));
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.signIn(user);
  }

  private async signIn(user: User): Promise<AuthResponse> {
    const { accessToken, expiresIn } = await this.tokenService.issue(
      String(user.id),
      { method: 'password', claims: { role: user.role } },
    );
    return { accessToken, expiresIn, user: toPublicUser(user) };
  }
}
