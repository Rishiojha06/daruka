import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleRoutesAdapter } from './google-routes.adapter';
import { MockRoutingProvider } from './mock-routing.provider';
import { ROUTING_PROVIDER } from './routing.types';

@Module({
  providers: [
    MockRoutingProvider,
    GoogleRoutesAdapter,
    {
      provide: ROUTING_PROVIDER,
      useFactory: (
        configService: ConfigService,
        mockProvider: MockRoutingProvider,
        googleAdapter: GoogleRoutesAdapter,
      ) => {
        const mode = configService.get<string>('routingProviderMode', 'mock');
        return mode === 'live' ? googleAdapter : mockProvider;
      },
      inject: [ConfigService, MockRoutingProvider, GoogleRoutesAdapter],
    },
  ],
  exports: [ROUTING_PROVIDER],
})
export class RoutingModule {}
