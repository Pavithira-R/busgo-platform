import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { ApiTags } from '@nestjs/swagger';
import {
  routeIdSchema,
  type SearchRoutesQuery,
  searchRoutesSchema,
  type SeatsQuery,
  seatsQuerySchema,
} from './bus-routes.schemas.js';
import { BusRoutesService } from './bus-routes.service.js';

/** Browsing buses needs no account. */
@ApiTags('routes')
@Public()
@Controller('routes')
export class BusRoutesController {
  constructor(private readonly busRoutesService: BusRoutesService) {}

  /** All bus stops / terminals. */
  @Get('stops')
  stops() {
    return this.busRoutesService.listStops();
  }

  /** Search routes, e.g. ?from=CMB&to=KDY&date=2026-12-01&serviceType=luxury */
  @Get()
  search(@Query({ schema: searchRoutesSchema }) query: SearchRoutesQuery) {
    return this.busRoutesService.search(query);
  }

  /** One route's details. */
  @Get(':id')
  findOne(@Param('id', { schema: routeIdSchema }) id: number) {
    return this.busRoutesService.findOne(id);
  }

  /** Seat map for a route on a date: which seats are free or booked. */
  @Get(':id/seats')
  seats(
    @Param('id', { schema: routeIdSchema }) id: number,
    @Query({ schema: seatsQuerySchema }) query: SeatsQuery,
  ) {
    return this.busRoutesService.seatMap(id, query.date);
  }
}
