import { Module } from '@nestjs/common';
import { BusRoutesController } from './bus-routes.controller.js';
import { BusRoutesService } from './bus-routes.service.js';

@Module({
  controllers: [BusRoutesController],
  providers: [BusRoutesService],
  exports: [BusRoutesService],
})
export class BusRoutesModule {}
