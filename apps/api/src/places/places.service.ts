import { Inject, Injectable } from '@nestjs/common';
import {
  AutocompleteResult,
  PlaceDetailsResult,
  ROUTING_PROVIDER,
  RoutingProvider,
} from '../routing/routing.types';

@Injectable()
export class PlacesService {
  constructor(
    @Inject(ROUTING_PROVIDER)
    private readonly routingProvider: RoutingProvider,
  ) {}

  async autocomplete(input: string): Promise<AutocompleteResult[]> {
    if (!input || input.trim().length < 2) {
      return [];
    }

    if (this.routingProvider.autocompletePlaces) {
      return this.routingProvider.autocompletePlaces(input);
    }
    return [];
  }

  async getDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    if (!placeId) {
      return null;
    }

    if (this.routingProvider.getPlaceDetails) {
      return this.routingProvider.getPlaceDetails(placeId);
    }
    return null;
  }
}
