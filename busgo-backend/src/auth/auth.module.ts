import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthProvider } from './jwt-auth.provider.js';
import { RolePolicy } from './role.policy.js';
import './auth.types.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthProvider, RolePolicy],
  exports: [RolePolicy],
})
export class AuthModule {}
