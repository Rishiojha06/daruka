import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('environment');
      });
  });

  it('/api/v1/meeting-points/search (POST) - happy path', () => {
    const payload = {
      riders: [
        { id: 'rider-a', location: { lat: 12.9698, lng: 77.75 } },
        { id: 'rider-b', location: { lat: 12.9352, lng: 77.6245 } },
      ],
      destination: { lat: 13.3702, lng: 77.6835 },
      preferences: {
        priority: 'balanced_arrival',
        maxDetourMinutes: 15,
        limit: 3,
      },
    };

    return request(app.getHttpServer())
      .post('/api/v1/meeting-points/search')
      .send(payload)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.routes).toBeDefined();
        expect(res.body.routes.riderA).toBeDefined();
        expect(res.body.routes.riderB).toBeDefined();
        expect(Array.isArray(res.body.recommendations)).toBe(true);
        expect(res.body.recommendations.length).toBeGreaterThan(0);
        expect(res.body.recommendations[0]).toHaveProperty('navigationUrl');
      });
  });

  it('/api/v1/meeting-points/search (POST) - rejects invalid coordinates', () => {
    const invalidPayload = {
      riders: [
        { id: 'rider-a', location: { lat: 192.9698, lng: 77.75 } }, // invalid lat
        { id: 'rider-b', location: { lat: 12.9352, lng: 77.6245 } },
      ],
      destination: { lat: 13.3702, lng: 77.6835 },
    };

    return request(app.getHttpServer())
      .post('/api/v1/meeting-points/search')
      .send(invalidPayload)
      .expect(400);
  });
});
