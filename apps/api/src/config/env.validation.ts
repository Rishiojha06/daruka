import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum RoutingProviderMode {
  Mock = 'mock',
  Live = 'live',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = '/api/v1';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:5173';

  @IsEnum(RoutingProviderMode)
  @IsOptional()
  ROUTING_PROVIDER_MODE: RoutingProviderMode = RoutingProviderMode.Mock;

  @IsString()
  @IsOptional()
  GOOGLE_MAPS_API_KEY?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => Object.values(err.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  // If running in live mode, GOOGLE_MAPS_API_KEY must be provided
  if (
    validatedConfig.ROUTING_PROVIDER_MODE === RoutingProviderMode.Live &&
    !validatedConfig.GOOGLE_MAPS_API_KEY
  ) {
    throw new Error(
      'GOOGLE_MAPS_API_KEY is required when ROUTING_PROVIDER_MODE is set to "live"',
    );
  }

  return validatedConfig;
}
