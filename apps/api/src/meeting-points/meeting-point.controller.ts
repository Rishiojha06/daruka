import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MeetingPointSearchResponse } from '@weekend-ride/shared-types';
import { SearchMeetingPointsDto } from './dto/search-meeting-points.dto';
import { MeetingPointService } from './meeting-point.service';

@Controller('meeting-points')
export class MeetingPointController {
  constructor(private readonly meetingPointService: MeetingPointService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(
    @Body() dto: SearchMeetingPointsDto,
  ): Promise<MeetingPointSearchResponse> {
    return this.meetingPointService.search(dto);
  }
}
