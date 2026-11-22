import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type PublicUser,
  toPublicUser,
  UsersService,
} from '../users/users.service.js';
import {
  type LoginDto,
  loginSchema,
  type RegisterDto,
  registerSchema,
  type UpdateProfileDto,
  updateProfileSchema,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /** Create a passenger account and sign in. */
  @Public()
  @Post('register')
  register(@Body({ schema: registerSchema }) body: RegisterDto) {
    return this.authService.register(body);
  }

  /** Sign in with email and password. */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body({ schema: loginSchema }) body: LoginDto) {
    return this.authService.login(body);
  }

  /** The signed-in user's profile. */
  @ApiBearerAuth()
  @Can.Anyone()
  @Get('me')
  me(@CurrentUser() user: PublicUser) {
    return user;
  }

  /** Update name, phone or NIC/passport number. */
  @ApiBearerAuth()
  @Can.Anyone()
  @Patch('me')
  async updateMe(
    @CurrentUser() user: PublicUser,
    @Body({ schema: updateProfileSchema }) body: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(user.id, body);
    if (!updated) throw new NotFoundException('User not found');
    return toPublicUser(updated);
  }
}
