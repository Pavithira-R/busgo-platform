import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module.js';
import { BusRoutesModule } from '../bus-routes/bus-routes.module.js';
import { QrController } from './qr.controller.js';
import { QrService } from './qr.service.js';

@Module({
  imports: [BookingsModule, BusRoutesModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
