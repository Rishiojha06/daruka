import { haversineDistanceMeters, interpolateCoordinates, samplePolyline } from './geo.utils';

describe('GeoUtils', () => {
  const whitefield = { lat: 12.9698, lng: 77.75 };
  const koramangala = { lat: 12.9352, lng: 77.6245 };

  it('calculates realistic distance between Whitefield and Koramangala (~14-16 km)', () => {
    const dist = haversineDistanceMeters(whitefield, koramangala);
    expect(dist).toBeGreaterThan(13000);
    expect(dist).toBeLessThan(16000);
  });

  it('returns zero for identical coordinates', () => {
    expect(haversineDistanceMeters(whitefield, whitefield)).toBe(0);
  });

  it('interpolates coordinates accurately', () => {
    const mid = interpolateCoordinates(whitefield, koramangala, 0.5);
    expect(mid.lat).toBeCloseTo((whitefield.lat + koramangala.lat) / 2, 4);
    expect(mid.lng).toBeCloseTo((whitefield.lng + koramangala.lng) / 2, 4);
  });

  it('samples a polyline at regular distance intervals', () => {
    const points = [whitefield, koramangala];
    const sampled = samplePolyline(points, 2000); // sample every 2 km

    expect(sampled.length).toBeGreaterThan(5);
    expect(sampled[0]).toEqual(whitefield);
  });
});
