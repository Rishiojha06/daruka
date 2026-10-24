import { Injectable } from '@nestjs/common';
import { Coordinates } from '@weekend-ride/shared-types';
import { haversineDistanceMeters, interpolateCoordinates } from '../common/geo.utils';
import {
  AutocompleteResult,
  PlaceCandidate,
  PlaceDetailsResult,
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

  async autocompletePlaces(input: string): Promise<AutocompleteResult[]> {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    const mockPlaces: { id: string; mainText: string; secondaryText: string; location: Coordinates }[] = [
      { id: 'mock-nandi', mainText: 'Nandi Hills', secondaryText: 'Chikkaballapur, Karnataka', location: { lat: 13.3702, lng: 77.6835 } },
      { id: 'mock-avalabetta', mainText: 'Avalabetta Hilltop', secondaryText: 'Chikkaballapur, Karnataka', location: { lat: 13.5786, lng: 77.7712 } },
      { id: 'mock-koramangala', mainText: 'Koramangala (Sony World)', secondaryText: 'Bengaluru South, Karnataka', location: { lat: 12.9352, lng: 77.6245 } },
      { id: 'mock-whitefield', mainText: 'Whitefield', secondaryText: 'Bengaluru East, Karnataka', location: { lat: 12.9698, lng: 77.75 } },
      { id: 'mock-indiranagar', mainText: 'Indiranagar (100 Feet Road)', secondaryText: 'Bengaluru East, Karnataka', location: { lat: 12.9784, lng: 77.6408 } },
      { id: 'mock-ecity', mainText: 'Electronic City Toll', secondaryText: 'Hosur Road / NH 44, Bengaluru', location: { lat: 12.8416, lng: 77.676 } },
      { id: 'mock-hebbal', mainText: 'Hebbal Flyover', secondaryText: 'Airport Road / NH 44, Bengaluru', location: { lat: 13.0358, lng: 77.597 } },
      { id: 'mock-kanakapura', mainText: 'Kanakapura Road (Art of Living)', secondaryText: 'NH 948, Bengaluru South', location: { lat: 12.7915, lng: 77.5085 } },
      { id: 'mock-mysore', mainText: 'Mysore Road (Kengeri / Expressway)', secondaryText: 'NH 275, Bengaluru West', location: { lat: 12.8984, lng: 77.4817 } },
      { id: 'mock-airport', mainText: 'Kempegowda International Airport (BLR)', secondaryText: 'Devanahalli, Bengaluru Rural', location: { lat: 13.1986, lng: 77.7066 } },
    ];

    const words = trimmed.split(/\s+/).filter(Boolean);
    return mockPlaces
      .filter((p) => {
        const text = `${p.mainText} ${p.secondaryText}`.toLowerCase();
        return words.every((w) => text.includes(w));
      })
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        placeId: p.id,
        mainText: p.mainText,
        secondaryText: p.secondaryText,
      }));
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    const mockCoordinatesMap: Record<string, { name: string; location: Coordinates; address: string }> = {
      'mock-nandi': { name: 'Nandi Hills', location: { lat: 13.3702, lng: 77.6835 }, address: 'Chikkaballapur, Karnataka' },
      'mock-avalabetta': { name: 'Avalabetta Hilltop', location: { lat: 13.5786, lng: 77.7712 }, address: 'Chikkaballapur, Karnataka' },
      'mock-koramangala': { name: 'Koramangala (Sony World)', location: { lat: 12.9352, lng: 77.6245 }, address: 'Bengaluru South, Karnataka' },
      'mock-whitefield': { name: 'Whitefield', location: { lat: 12.9698, lng: 77.75 }, address: 'Bengaluru East, Karnataka' },
      'mock-indiranagar': { name: 'Indiranagar (100 Feet Road)', location: { lat: 12.9784, lng: 77.6408 }, address: 'Bengaluru East, Karnataka' },
      'mock-ecity': { name: 'Electronic City Toll', location: { lat: 12.8416, lng: 77.676 }, address: 'Hosur Road / NH 44, Bengaluru' },
      'mock-hebbal': { name: 'Hebbal Flyover', location: { lat: 13.0358, lng: 77.597 }, address: 'Airport Road / NH 44, Bengaluru' },
      'mock-kanakapura': { name: 'Kanakapura Road (Art of Living)', location: { lat: 12.7915, lng: 77.5085 }, address: 'NH 948, Bengaluru South' },
      'mock-mysore': { name: 'Mysore Road (Kengeri / Expressway)', location: { lat: 12.8984, lng: 77.4817 }, address: 'NH 275, Bengaluru West' },
      'mock-airport': { name: 'Kempegowda International Airport (BLR)', location: { lat: 13.1986, lng: 77.7066 }, address: 'Devanahalli, Bengaluru Rural' },
    };

    const found = mockCoordinatesMap[placeId];
    if (found) {
      return {
        placeId,
        name: found.name,
        location: found.location,
        formattedAddress: found.address,
      };
    }

    return {
      placeId,
      name: 'Bengaluru Location',
      location: { lat: 12.9716, lng: 77.5946 },
    };
  }

  buildDirectionsUrl(destination: Coordinates, origin?: Coordinates): string {
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=two_wheeler`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=two_wheeler`;
  }
}
