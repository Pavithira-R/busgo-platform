import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { PublicUser } from '../users/users.service.js';
import {
  type CreateBookingDto,
  createBookingSchema,
  ticketIdSchema,
} from './bookings.schemas.js';
import { BookingsService } from './bookings.service.js';

/** All booking routes need a signed-in user. */
@ApiTags('bookings')
@ApiBearerAuth()
@Can.Anyone()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** Book a seat and get an e-ticket with a QR code. */
  @Post()
  create(
    @CurrentUser() user: PublicUser,
    @Body({ schema: createBookingSchema }) body: CreateBookingDto,
  ) {
    return this.bookingsService.create(user, body);
  }

  /** The signed-in passenger's bookings, newest first. */
  @Get()
  mine(@CurrentUser() user: PublicUser) {
    return this.bookingsService.listMine(user);
  }

  /** One e-ticket with its QR code. */
  @Get(':ticketId')
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('ticketId', { schema: ticketIdSchema }) ticketId: string,
  ) {
    return this.bookingsService.findForUser(user, ticketId);
  }

  /** Preview the refund before cancelling. */
  @Get(':ticketId/cancellation')
  cancellationQuote(
    @CurrentUser() user: PublicUser,
    @Param('ticketId', { schema: ticketIdSchema }) ticketId: string,
  ) {
    return this.bookingsService.quoteCancellation(user, ticketId);
  }

  /** Cancel a booking; the refund follows the cancellation policy. */
  @Put(':ticketId/cancel')
  cancel(
    @CurrentUser() user: PublicUser,
    @Param('ticketId', { schema: ticketIdSchema }) ticketId: string,
  ) {
    return this.bookingsService.cancel(user, ticketId);
  }
}
