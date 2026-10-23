import { decodePolyline } from './polyline.utils';

describe('PolylineUtils', () => {
  it('decodes a standard Google encoded polyline', () => {
    // Encoded polyline for points around (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const points = decodePolyline(encoded);

    expect(points.length).toBe(3);
    expect(points[0].lat).toBeCloseTo(38.5, 4);
    expect(points[0].lng).toBeCloseTo(-120.2, 4);
    expect(points[1].lat).toBeCloseTo(40.7, 4);
    expect(points[1].lng).toBeCloseTo(-120.95, 4);
    expect(points[2].lat).toBeCloseTo(43.252, 3);
    expect(points[2].lng).toBeCloseTo(-126.453, 3);
  });

  it('handles empty string gracefully', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});
