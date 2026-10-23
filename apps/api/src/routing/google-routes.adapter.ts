import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Coordinates } from '@weekend-ride/shared-types';
import { decodePolyline } from '../common/polyline.utils';
import {
  RouteNotFoundException,
  RouteProviderRateLimitException,
  RouteProviderTimeoutException,
  RouteProviderUnavailableException,
} from './routing.exceptions';
import {
  PlaceCandidate,
  RouteMatrixCell,
  RouteResult,
  RoutingProvider,
} from './routing.types';

@Injectable()
export class GoogleRoutesAdapter implements RoutingProvider {
  private readonly logger = new Logger(GoogleRoutesAdapter.name);
  private readonly apiKey: string;
  private readonly timeoutMs = 8000;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('googleMapsApiKey', '');
    if (!this.apiKey) {
      this.logger.warn('GoogleRoutesAdapter initialized without GOOGLE_MAPS_API_KEY');
    }
  }

  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const payload = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng,
          },
        },
      },
      travelMode: 'TWO_WHEELER',
      routingPreference: 'TRAFFIC_AWARE',
      polylineQuality: 'HIGH_QUALITY',
    };

    const response = await this.executeFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new RouteNotFoundException();
    }

    const route = data.routes[0];
    const durationSeconds = this.parseDurationSeconds(route.duration);
    const distanceMeters = route.distanceMeters || 0;
    const encodedPolyline = route.polyline?.encodedPolyline || '';
    const geometry = encodedPolyline ? decodePolyline(encodedPolyline) : [origin, destination];

    return {
      distanceMeters,
      durationSeconds,
      encodedPolyline,
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
    const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
    const payload = {
      origins: origins.map((o) => ({
        waypoint: {
          location: {
            latLng: {
              latitude: o.lat,
              longitude: o.lng,
            },
          },
        },
      })),
      destinations: destinations.map((d) => ({
        waypoint: {
          location: {
            latLng: {
              latitude: d.lat,
              longitude: d.lng,
            },
          },
        },
      })),
      travelMode: 'TWO_WHEELER',
      routingPreference: 'TRAFFIC_AWARE',
    };

    const response = await this.executeFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status',
      },
      body: JSON.stringify(payload),
    });

    // Handle JSON stream response (an array of JSON objects or newline-separated/bracket-enclosed JSON)
    const text = await response.text();
    const cells: RouteMatrixCell[] = [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          cells.push(this.mapMatrixItem(item));
        }
      }
    } catch {
      // If streamed as NDJSON chunks:
      const lines = text.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line.replace(/^[[,]/, '').replace(/]$/, ''));
          cells.push(this.mapMatrixItem(item));
        } catch {
          // Ignore malformed chunk
        }
      }
    }

    return cells;
  }

  async searchPlaces(
    center: Coordinates,
    categories: string[],
    radiusMeters: number,
  ): Promise<PlaceCandidate[]> {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const payload = {
      includedTypes: categories,
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: {
            latitude: center.lat,
            longitude: center.lng,
          },
          radius: radiusMeters,
        },
      },
    };

    try {
      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.primaryType,places.location,places.formattedAddress',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!data.places || !Array.isArray(data.places)) {
        return [];
      }

      return data.places.map((place: any) => ({
        providerPlaceId: place.id,
        name: place.displayName?.text || 'Convenient Stopping Point',
        category: place.primaryType,
        location: {
          lat: place.location?.latitude || center.lat,
          lng: place.location?.longitude || center.lng,
        },
        address: place.formattedAddress,
      }));
    } catch (err) {
      this.logger.warn(`Place search failed: ${(err as Error).message}`);
      return [];
    }
  }

  buildDirectionsUrl(destination: Coordinates, origin?: Coordinates): string {
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=two_wheeler`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=two_wheeler`;
  }

  private async executeFetch(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.status === 429) {
        throw new RouteProviderRateLimitException();
      }

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.error(`Google API request failed [HTTP ${res.status}]: ${errorText}`);

        let friendlyMessage = `Provider returned HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error?.message) {
            friendlyMessage = parsed.error.message;
          }
        } catch {
          // keep generic
        }

        if (res.status === 403) {
          if (
            friendlyMessage.includes('has not been used in project') ||
            friendlyMessage.includes('is disabled')
          ) {
            friendlyMessage =
              'Google Routes API is not enabled in your Google Cloud Console. Enable "Routes API" in APIs & Services > Library.';
          } else if (
            friendlyMessage.toLowerCase().includes('referrer') ||
            friendlyMessage.toLowerCase().includes('referer')
          ) {
            friendlyMessage =
              'Your server API key has HTTP referrer restrictions. In Google Console > Credentials, set Application restriction to "None" or "IP addresses" for the backend server key.';
          } else if (friendlyMessage.toLowerCase().includes('billing')) {
            friendlyMessage =
              'Google Cloud Billing is not enabled for this project. Please link an active billing account.';
          }
        }

        throw new RouteProviderUnavailableException(friendlyMessage);
      }

      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new RouteProviderTimeoutException();
      }
      if (err instanceof RouteProviderRateLimitException || err instanceof RouteProviderUnavailableException) {
        throw err;
      }
      throw new RouteProviderUnavailableException(err.message);
    }
  }

  private parseDurationSeconds(durationStr?: string): number {
    if (!durationStr) return 0;
    // Format is e.g. "1245s"
    const match = durationStr.match(/^(\d+(\.\d+)?)s$/);
    return match ? Math.round(parseFloat(match[1])) : 0;
  }

  private mapMatrixItem(item: any): RouteMatrixCell {
    const isError = item.status && item.status.code && item.status.code !== 0;
    return {
      originIndex: item.originIndex ?? 0,
      destinationIndex: item.destinationIndex ?? 0,
      distanceMeters: item.distanceMeters,
      durationSeconds: this.parseDurationSeconds(item.duration),
      status: isError ? 'unreachable' : 'ok',
    };
  }
}
