import { Module } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module';
import { MeetingPointController } from './meeting-point.controller';
import { MeetingPointService } from './meeting-point.service';

@Module({
  imports: [RoutingModule],
  controllers: [MeetingPointController],
  providers: [MeetingPointService],
  exports: [MeetingPointService],
})
export class MeetingPointModule {}
