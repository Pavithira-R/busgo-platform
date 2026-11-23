import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolePolicy } from '../auth/role.policy.js';
import { ticketIdSchema } from '../bookings/bookings.schemas.js';
import type { PublicUser } from '../users/users.service.js';
import { type ValidateScanDto, validateScanSchema } from './qr.schemas.js';
import { QrService } from './qr.service.js';

/** Ticket checking at bus stands: gate staff and admins only. */
@ApiTags('qr')
@ApiBearerAuth()
@Can(RolePolicy, 'staff')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  /** Scan a ticket: checks it, marks it used if valid and logs the scan. */
  @Post('validate')
  @HttpCode(200)
  validate(
    @CurrentUser() staff: PublicUser,
    @Body({ schema: validateScanSchema }) body: ValidateScanDto,
  ) {
    return this.qrService.validate(staff, body);
  }

  /** Look up a ticket without marking it used (e.g. for a dispute). */
  @Get('lookup/:ticketId')
  lookup(@Param('ticketId', { schema: ticketIdSchema }) ticketId: string) {
    return this.qrService.lookup(ticketId);
  }

  /** Every scan attempt for a ticket, newest first. */
  @Get('history/:ticketId')
  history(@Param('ticketId', { schema: ticketIdSchema }) ticketId: string) {
    return this.qrService.history(ticketId);
  }
}
