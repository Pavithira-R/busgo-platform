import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module.js';
import { BusRoutesModule } from '../bus-routes/bus-routes.module.js';
import { AdminOperatorsController } from './admin-operators.controller.js';
import { AdminOperatorsService } from './admin-operators.service.js';
import { AdminRoutesController } from './admin-routes.controller.js';
import { AdminRoutesService } from './admin-routes.service.js';

/** Admin panel API: admins only. */
@Module({
  imports: [BookingsModule, BusRoutesModule],
  controllers: [AdminOperatorsController, AdminRoutesController],
  providers: [AdminOperatorsService, AdminRoutesService],
})
export class AdminModule {}
