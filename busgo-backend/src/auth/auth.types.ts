import type { PublicUser } from '../users/users.service.js';

// Tells @nestjs/authentication what a signed-in user looks like, and that
// BusGo issues access tokens only (no refresh tokens).
declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: PublicUser;
    refreshTokens: false;
  }
}
