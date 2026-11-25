import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolePolicy } from '../auth/role.policy.js';
import {
  type CreateOperatorDto,
  createOperatorSchema,
  idParamSchema,
  type UpdateOperatorDto,
  updateOperatorSchema,
} from './admin.schemas.js';
import { AdminOperatorsService } from './admin-operators.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Can(RolePolicy, 'admin')
@Controller('admin/operators')
export class AdminOperatorsController {
  constructor(private readonly operatorsService: AdminOperatorsService) {}

  /** All operators, including deactivated ones. */
  @Get()
  list() {
    return this.operatorsService.list();
  }

  /** Add a private bus operator. */
  @Post()
  create(@Body({ schema: createOperatorSchema }) body: CreateOperatorDto) {
    return this.operatorsService.create(body);
  }

  /** Edit an operator, or deactivate it with { "isActive": false }. */
  @Patch(':id')
  update(
    @Param('id', { schema: idParamSchema }) id: number,
    @Body({ schema: updateOperatorSchema }) body: UpdateOperatorDto,
  ) {
    return this.operatorsService.update(id, body);
  }
}
