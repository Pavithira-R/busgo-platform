import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolePolicy } from '../auth/role.policy.js';
import {
  type BoardingPointsDto,
  boardingPointsSchema,
  type CancelTripDto,
  cancelTripSchema,
  type CreateRouteDto,
  createRouteSchema,
  idParamSchema,
  type RouteListQuery,
  routeListQuerySchema,
  type UpdateRouteDto,
  updateRouteSchema,
} from './admin.schemas.js';
import { AdminRoutesService } from './admin-routes.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Can(RolePolicy, 'admin')
@Controller('admin/routes')
export class AdminRoutesController {
  constructor(private readonly routesService: AdminRoutesService) {}

  /** All routes, including deactivated ones. Filter with ?operatorId= */
  @Get()
  list(@Query({ schema: routeListQuerySchema }) query: RouteListQuery) {
    return this.routesService.list(query);
  }

  /** A route with boarding points and upcoming booking count. */
  @Get(':id')
  details(@Param('id', { schema: idParamSchema }) id: number) {
    return this.routesService.details(id);
  }

  /** Add a bus service. */
  @Post()
  create(@Body({ schema: createRouteSchema }) body: CreateRouteDto) {
    return this.routesService.create(body);
  }

  /** Edit a route, or stop selling it with { "isActive": false }. */
  @Patch(':id')
  update(
    @Param('id', { schema: idParamSchema }) id: number,
    @Body({ schema: updateRouteSchema }) body: UpdateRouteDto,
  ) {
    return this.routesService.update(id, body);
  }

  /** Replace the route's boarding points with an ordered list. */
  @Put(':id/boarding-points')
  setBoardingPoints(
    @Param('id', { schema: idParamSchema }) id: number,
    @Body({ schema: boardingPointsSchema }) body: BoardingPointsDto,
  ) {
    return this.routesService.setBoardingPoints(id, body);
  }

  /** Cancel one day's trip: all passengers get a full refund and an email. */
  @Post(':id/cancel-trip')
  @HttpCode(200)
  cancelTrip(
    @Param('id', { schema: idParamSchema }) id: number,
    @Body({ schema: cancelTripSchema }) body: CancelTripDto,
  ) {
    return this.routesService.cancelTrip(id, body);
  }
}
