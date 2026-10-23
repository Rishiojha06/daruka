import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'nodeEnv') return 'test';
              if (key === 'routingProviderMode') return 'mock';
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.environment).toBe('test');
    expect(result.routingProviderMode).toBe('mock');
    expect(typeof result.uptime).toBe('number');
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });
});
