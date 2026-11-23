import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolePolicy } from '../auth/role.policy.js';
import type { PublicUser } from '../users/users.service.js';
import {
  type CreateStaffDto,
  createStaffSchema,
  idParamSchema,
  type UserStatusDto,
  userStatusSchema,
} from './admin.schemas.js';
import { AdminUsersService } from './admin-users.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Can(RolePolicy, 'admin')
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  /** Gate staff and admin accounts. */
  @Get('staff')
  staff() {
    return this.usersService.staff();
  }

  /** Create a gate staff account. */
  @Post('staff')
  createStaff(@Body({ schema: createStaffSchema }) body: CreateStaffDto) {
    return this.usersService.createStaff(body);
  }

  /** Deactivate or reactivate a passenger or staff account. */
  @Patch('users/:id/status')
  setStatus(
    @CurrentUser() admin: PublicUser,
    @Param('id', { schema: idParamSchema }) id: number,
    @Body({ schema: userStatusSchema }) body: UserStatusDto,
  ) {
    return this.usersService.setStatus(admin, id, body);
  }
}
