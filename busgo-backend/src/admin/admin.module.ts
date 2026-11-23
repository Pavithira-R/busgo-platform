import { Module } from '@nestjs/common';
import { AdminOperatorsController } from './admin-operators.controller.js';
import { AdminOperatorsService } from './admin-operators.service.js';

/** Admin panel API: admins only. */
@Module({
  controllers: [AdminOperatorsController],
  providers: [AdminOperatorsService],
})
export class AdminModule {}
