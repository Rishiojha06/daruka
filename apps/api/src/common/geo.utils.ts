import { Coordinates } from '@weekend-ride/shared-types';

const EARTH_RADIUS_METERS = 6371000;

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two coordinates in meters.
 */
export function haversineDistanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);

  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinHalfLng * sinHalfLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Computes intermediate point along great circle path at fraction t (0 <= t <= 1).
 */
export function interpolateCoordinates(a: Coordinates, b: Coordinates, t: number): Coordinates {
  const lat = a.lat + (b.lat - a.lat) * t;
  const lng = a.lng + (b.lng - a.lng) * t;
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

/**
 * Samples points along an ordered array of coordinates at approximately `intervalMeters`.
 */
export function samplePolyline(points: Coordinates[], intervalMeters: number): Coordinates[] {
  if (points.length <= 1) return [...points];

  const sampled: Coordinates[] = [points[0]];
  let accumulatedDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentDistance = haversineDistanceMeters(p1, p2);

    if (segmentDistance === 0) continue;

    let distanceToNextSample = intervalMeters - accumulatedDistance;

    while (distanceToNextSample <= segmentDistance) {
      const t = distanceToNextSample / segmentDistance;
      sampled.push(interpolateCoordinates(p1, p2, t));
      distanceToNextSample += intervalMeters;
    }

    accumulatedDistance = segmentDistance - (distanceToNextSample - intervalMeters);
  }

  // Always include destination endpoint if not very close to last sample
  const lastSample = sampled[sampled.length - 1];
  const endPoint = points[points.length - 1];
  if (haversineDistanceMeters(lastSample, endPoint) > intervalMeters * 0.3) {
    sampled.push(endPoint);
  }

  return sampled;
}
