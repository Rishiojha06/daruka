import { Injectable } from '@nestjs/common';
import { Coordinates } from '@weekend-ride/shared-types';
import { haversineDistanceMeters, interpolateCoordinates } from '../common/geo.utils';
import {
  PlaceCandidate,
  RouteMatrixCell,
  RouteResult,
  RoutingProvider,
} from './routing.types';

@Injectable()
export class MockRoutingProvider implements RoutingProvider {
  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    const straightDist = haversineDistanceMeters(origin, destination);
    // Typical Indian urban/suburban road network factor: ~1.28x direct distance
    const distanceMeters = Math.round(straightDist * 1.28);

    // Motorcycle urban speed average ~35 km/h (9.7 m/s) with traffic
    const speedMps = 9.7;
    const durationSeconds = Math.round(distanceMeters / speedMps);

    // Generate intermediate path vertices (8-12 points)
    const steps = 10;
    const geometry: Coordinates[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Introduce slight curve simulating actual arterial roads
      const intermediate = interpolateCoordinates(origin, destination, t);
      const wobble = Math.sin(t * Math.PI) * 0.008;
      geometry.push({
        lat: Number((intermediate.lat + wobble).toFixed(6)),
        lng: Number((intermediate.lng - wobble).toFixed(6)),
      });
    }

    return {
      distanceMeters,
      durationSeconds,
      geometry,
      providerMetadata: {
        trafficAware: true,
        travelMode: 'TWO_WHEELER',
      },
    };
  }

  async getRouteMatrix(
    origins: Coordinates[],
    destinations: Coordinates[],
  ): Promise<RouteMatrixCell[]> {
    const cells: RouteMatrixCell[] = [];

    for (let i = 0; i < origins.length; i++) {
      for (let j = 0; j < destinations.length; j++) {
        const straight = haversineDistanceMeters(origins[i], destinations[j]);
        const distanceMeters = Math.round(straight * 1.28);
        const durationSeconds = Math.round(distanceMeters / 9.7);

        cells.push({
          originIndex: i,
          destinationIndex: j,
          distanceMeters,
          durationSeconds,
          status: 'ok',
        });
      }
    }

    return cells;
  }

  async searchPlaces(
    center: Coordinates,
    _categories: string[],
    _radiusMeters: number,
  ): Promise<PlaceCandidate[]> {
    return [
      {
        providerPlaceId: 'mock-place-fuel-1',
        name: 'IndianOil Fuel & Highway Cafe',
        category: 'fuel_station',
        location: {
          lat: Number((center.lat + 0.001).toFixed(6)),
          lng: Number((center.lng + 0.001).toFixed(6)),
        },
        address: 'Bellary Road / NH 44, Bengaluru',
      },
      {
        providerPlaceId: 'mock-place-cafe-2',
        name: 'Riders Rest Cafe',
        category: 'cafe',
        location: {
          lat: Number((center.lat - 0.0012).toFixed(6)),
          lng: Number((center.lng + 0.0008).toFixed(6)),
        },
        address: 'Service Road, Bengaluru',
      },
    ];
  }

  buildDirectionsUrl(destination: Coordinates, origin?: Coordinates): string {
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=two_wheeler`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=two_wheeler`;
  }
}
