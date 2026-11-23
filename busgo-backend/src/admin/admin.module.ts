import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module.js';
import { BusRoutesModule } from '../bus-routes/bus-routes.module.js';
import { UsersModule } from '../users/users.module.js';
import { AdminInsightsController } from './admin-insights.controller.js';
import { AdminInsightsService } from './admin-insights.service.js';
import { AdminOperatorsController } from './admin-operators.controller.js';
import { AdminOperatorsService } from './admin-operators.service.js';
import { AdminRoutesController } from './admin-routes.controller.js';
import { AdminRoutesService } from './admin-routes.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';

/** Admin panel API: admins only. */
@Module({
  imports: [BookingsModule, BusRoutesModule, UsersModule],
  controllers: [
    AdminOperatorsController,
    AdminRoutesController,
    AdminInsightsController,
    AdminUsersController,
  ],
  providers: [
    AdminOperatorsService,
    AdminRoutesService,
    AdminInsightsService,
    AdminUsersService,
  ],
})
export class AdminModule {}
