import { Coordinates } from '@weekend-ride/shared-types';

/**
 * Decodes an encoded polyline string (Google Polyline Algorithm Format) into coordinates.
 */
export function decodePolyline(encoded: string): Coordinates[] {
  const points: Coordinates[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: Number((lat / 1e5).toFixed(6)),
      lng: Number((lng / 1e5).toFixed(6)),
    });
  }

  return points;
}
