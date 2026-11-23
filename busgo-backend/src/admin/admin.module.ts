import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module.js';
import { BusRoutesModule } from '../bus-routes/bus-routes.module.js';
import { AdminInsightsController } from './admin-insights.controller.js';
import { AdminInsightsService } from './admin-insights.service.js';
import { AdminOperatorsController } from './admin-operators.controller.js';
import { AdminOperatorsService } from './admin-operators.service.js';
import { AdminRoutesController } from './admin-routes.controller.js';
import { AdminRoutesService } from './admin-routes.service.js';

/** Admin panel API: admins only. */
@Module({
  imports: [BookingsModule, BusRoutesModule],
  controllers: [
    AdminOperatorsController,
    AdminRoutesController,
    AdminInsightsController,
  ],
  providers: [AdminOperatorsService, AdminRoutesService, AdminInsightsService],
})
export class AdminModule {}
