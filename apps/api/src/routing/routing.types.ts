import { Coordinates } from '@weekend-ride/shared-types';

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline?: string;
  geometry: Coordinates[];
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
  buildDirectionsUrl(destination: Coordinates, origin?: Coordinates): string;
}

export const ROUTING_PROVIDER = Symbol('ROUTING_PROVIDER');
