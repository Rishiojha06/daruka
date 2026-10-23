import { Environment, RoutingProviderMode, validate } from './env.validation';

describe('Environment Validation', () => {
  it('should use default values when given an empty config', () => {
    const config = validate({});
    expect(config.NODE_ENV).toBe(Environment.Development);
    expect(config.PORT).toBe(4000);
    expect(config.API_PREFIX).toBe('/api/v1');
    expect(config.CORS_ORIGIN).toBe('http://localhost:5173');
    expect(config.ROUTING_PROVIDER_MODE).toBe(RoutingProviderMode.Mock);
  });

  it('should parse valid custom values', () => {
    const config = validate({
      PORT: '5000',
      NODE_ENV: 'production',
      ROUTING_PROVIDER_MODE: 'mock',
    });
    expect(config.PORT).toBe(5000);
    expect(config.NODE_ENV).toBe(Environment.Production);
  });

  it('should throw when live mode is specified without GOOGLE_MAPS_API_KEY', () => {
    expect(() =>
      validate({
        ROUTING_PROVIDER_MODE: 'live',
      }),
    ).toThrow('GOOGLE_MAPS_API_KEY is required when ROUTING_PROVIDER_MODE is set to "live"');
  });

  it('should pass in live mode when GOOGLE_MAPS_API_KEY is provided', () => {
    const config = validate({
      ROUTING_PROVIDER_MODE: 'live',
      GOOGLE_MAPS_API_KEY: 'test_key_123',
    });
    expect(config.ROUTING_PROVIDER_MODE).toBe(RoutingProviderMode.Live);
    expect(config.GOOGLE_MAPS_API_KEY).toBe('test_key_123');
  });

  it('should throw when PORT is invalid', () => {
    expect(() =>
      validate({
        PORT: '-10',
      }),
    ).toThrow('Environment validation failed');
  });
});
