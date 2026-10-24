import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('autocomplete')
  async autocomplete(@Query('input') input?: string) {
    const suggestions = await this.placesService.autocomplete(input || '');
    return {
      status: 'ok',
      suggestions,
    };
  }

  @Get('details/:placeId')
  async getDetails(@Param('placeId') placeId: string) {
    const details = await this.placesService.getDetails(placeId);
    if (!details) {
      return {
        status: 'error',
        message: 'Place not found',
      };
    }
    return {
      status: 'ok',
      details,
    };
  }
}
