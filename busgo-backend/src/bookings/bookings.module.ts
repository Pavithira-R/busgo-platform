import { Module } from '@nestjs/common';
import { BusRoutesModule } from '../bus-routes/bus-routes.module.js';
import { BookingPolicy } from './booking.policy.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { TicketMailer } from './ticket-mailer.service.js';

@Module({
  imports: [BusRoutesModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingPolicy, TicketMailer],
  exports: [BookingsService],
})
export class BookingsModule {}
