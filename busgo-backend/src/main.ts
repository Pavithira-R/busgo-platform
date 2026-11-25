import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN') });
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BusGo API')
    .setDescription('Bus e-ticket booking and QR validation API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(config.get<number>('PORT') ?? 3000);
}
await bootstrap();
