import { Controller, Get, Query } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolePolicy } from '../auth/role.policy.js';
import {
  type BookingListQuery,
  bookingListQuerySchema,
  type DashboardQuery,
  dashboardQuerySchema,
  type UserListQuery,
  userListQuerySchema,
} from './admin.schemas.js';
import { AdminInsightsService } from './admin-insights.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Can(RolePolicy, 'admin')
@Controller('admin')
export class AdminInsightsController {
  constructor(private readonly insights: AdminInsightsService) {}

  /** Bookings, revenue, top routes and daily trend. ?from=&to= (default last 30 days) */
  @Get('dashboard')
  dashboard(@Query({ schema: dashboardQuerySchema }) query: DashboardQuery) {
    return this.insights.dashboard(query);
  }

  /** All bookings. ?status=&travelDate=&routeId=&operatorId=&search=&page=&limit= */
  @Get('bookings')
  bookings(@Query({ schema: bookingListQuerySchema }) query: BookingListQuery) {
    return this.insights.bookings(query);
  }

  /** Registered passengers. ?search=&page=&limit= */
  @Get('passengers')
  passengers(@Query({ schema: userListQuerySchema }) query: UserListQuery) {
    return this.insights.passengers(query);
  }
}
