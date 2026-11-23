import { Module } from '@nestjs/common';
import { AuthenticationModule, type Duration } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { LogMailTransport, MailModule } from '@nestjs/mail';
import { createObserveModule } from '@nestjs/observe';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { BusRoutesModule } from './bus-routes/bus-routes.module.js';
import { envSchema } from './config/env.js';
import { relations } from './db/relations.js';
import { PreviewMailTransport } from './mail/preview-mail.transport.js';
import { QrModule } from './qr/qr.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: config.getOrThrow<string>('DATABASE_URL'),
        relations,
      }),
    }),
    // Every route needs a signed-in user unless marked @Public().
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accessToken: {
          key: config.getOrThrow<string>('JWT_SECRET'),
          ttl: config.getOrThrow<string>('JWT_TTL') as Duration,
          issuer: 'busgo-api',
        },
        refreshToken: false,
      }),
    }),
    // Every route must declare who may use it: @Can(...), @Can.Anyone() or @Public().
    AuthorizationModule.forRoot(),
    MailModule.forRootAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        from: config.getOrThrow<string>('MAIL_FROM'),
        transport:
          config.get('MAIL_TRANSPORT') === 'log'
            ? new LogMailTransport({ body: false })
            : new PreviewMailTransport(config.getOrThrow<string>('MAIL_DIR')),
      }),
    }),
    AuthModule,
    BusRoutesModule,
    BookingsModule,
    QrModule,
    // Optional telemetry. Sends nothing until OBSERVE_APP_KEY is set in .env.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'busgo-backend',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
