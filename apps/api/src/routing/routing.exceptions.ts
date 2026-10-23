import { HttpException, HttpStatus } from '@nestjs/common';

export class RouteException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
  ) {
    super(
      {
        status: 'error',
        error: {
          code,
          message,
        },
      },
      status,
    );
  }
}

export class RouteNotFoundException extends RouteException {
  constructor(message = 'One or more routes could not be calculated by the routing provider.') {
    super('ROUTE_NOT_FOUND', message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class RouteProviderUnavailableException extends RouteException {
  constructor(message = 'The routing provider is temporarily unavailable. Please try again.') {
    super('ROUTE_PROVIDER_UNAVAILABLE', message, HttpStatus.BAD_GATEWAY);
  }
}

export class RouteProviderRateLimitException extends RouteException {
  constructor(message = 'Too many requests. Please wait a moment before trying again.') {
    super('RATE_LIMITED', message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class RouteProviderTimeoutException extends RouteException {
  constructor(message = 'Routing service request timed out.') {
    super('REQUEST_TIMEOUT', message, HttpStatus.GATEWAY_TIMEOUT);
  }
}
