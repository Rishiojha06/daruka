import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { MeetingPointModule } from './meeting-points/meeting-point.module';
import { PlacesModule } from './places/places.module';
import { RoutingModule } from './routing/routing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    HealthModule,
    RoutingModule,
    MeetingPointModule,
    PlacesModule,
  ],
})
export class AppModule {}
