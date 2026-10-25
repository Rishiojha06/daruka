import { Coordinates } from '@weekend-ride/shared-types';

export interface RouteAlternative {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline?: string;
  geometry: Coordinates[];
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline?: string;
  geometry: Coordinates[];
  alternatives?: RouteAlternative[];
  providerMetadata?: {
    trafficAware?: boolean;
    travelMode?: string;
  };
}

export type RouteMatrixCellStatus = 'ok' | 'unreachable' | 'error';

export interface RouteMatrixCell {
  originIndex: number;
  destinationIndex: number;
  distanceMeters?: number;
  durationSeconds?: number;
  status: RouteMatrixCellStatus;
}

export interface PlaceCandidate {
  providerPlaceId?: string;
  name: string;
  category?: string;
  location: Coordinates;
  address?: string;
}

export interface AutocompleteResult {
  id: string;
  placeId?: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetailsResult {
  placeId: string;
  name: string;
  location: Coordinates;
  formattedAddress?: string;
}

export interface RoutingProvider {
  getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult>;
  getRouteMatrix(
    origins: Coordinates[],
    destinations: Coordinates[],
  ): Promise<RouteMatrixCell[]>;
  searchPlaces?(
    center: Coordinates,
    categories: string[],
    radiusMeters: number,
  ): Promise<PlaceCandidate[]>;
  autocompletePlaces?(input: string): Promise<AutocompleteResult[]>;
  getPlaceDetails?(placeId: string): Promise<PlaceDetailsResult | null>;
  buildDirectionsUrl(destination: Coordinates, origin?: Coordinates): string;
}

export const ROUTING_PROVIDER = Symbol('ROUTING_PROVIDER');
