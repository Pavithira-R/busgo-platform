import { Controller, Get } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('health')
@Public()
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  health() {
    return this.appService.health();
  }
}
