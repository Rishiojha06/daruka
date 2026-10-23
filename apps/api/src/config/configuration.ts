export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  routingProviderMode: process.env.ROUTING_PROVIDER_MODE || 'mock',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
});
