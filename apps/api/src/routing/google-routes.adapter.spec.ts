import { ConfigService } from '@nestjs/config';
import { GoogleRoutesAdapter } from './google-routes.adapter';
import {
  RouteNotFoundException,
  RouteProviderRateLimitException,
  RouteProviderUnavailableException,
} from './routing.exceptions';

describe('GoogleRoutesAdapter', () => {
  let adapter: GoogleRoutesAdapter;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    const configService = {
      get: jest.fn().mockReturnValue('test-api-key-12345'),
    } as unknown as ConfigService;
    adapter = new GoogleRoutesAdapter(configService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const origin = { lat: 12.9698, lng: 77.75 };
  const destination = { lat: 13.3702, lng: 77.6835 };

  it('maps successful route response into RouteResult', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        routes: [
          {
            distanceMeters: 45000,
            duration: '3600s',
            polyline: {
              encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
            },
          },
        ],
      }),
    });

    const result = await adapter.getRoute(origin, destination);

    expect(result.distanceMeters).toBe(45000);
    expect(result.durationSeconds).toBe(3600);
    expect(result.geometry.length).toBe(3);
    expect(result.providerMetadata?.travelMode).toBe('TWO_WHEELER');
  });

  it('throws RouteNotFoundException when routes array is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ routes: [] }),
    });

    await expect(adapter.getRoute(origin, destination)).rejects.toThrow(RouteNotFoundException);
  });

  it('throws RouteProviderRateLimitException on HTTP 429', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    await expect(adapter.getRoute(origin, destination)).rejects.toThrow(RouteProviderRateLimitException);
  });

  it('throws RouteProviderUnavailableException on provider error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(adapter.getRoute(origin, destination)).rejects.toThrow(RouteProviderUnavailableException);
  });

  it('builds standard directions navigation url', () => {
    const url = adapter.buildDirectionsUrl(destination, origin);
    expect(url).toContain('destination=13.3702,77.6835');
    expect(url).toContain('origin=12.9698,77.75');
    expect(url).toContain('travelmode=two_wheeler');
  });
});
