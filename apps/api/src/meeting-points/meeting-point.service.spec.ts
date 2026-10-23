import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockRoutingProvider } from '../routing/mock-routing.provider';
import { ROUTING_PROVIDER } from '../routing/routing.types';
import { SearchMeetingPointsDto } from './dto/search-meeting-points.dto';
import { MeetingPointService } from './meeting-point.service';

describe('MeetingPointService', () => {
  let service: MeetingPointService;
  let mockProvider: MockRoutingProvider;

  beforeEach(async () => {
    mockProvider = new MockRoutingProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingPointService,
        {
          provide: ROUTING_PROVIDER,
          useValue: mockProvider,
        },
      ],
    }).compile();

    service = module.get<MeetingPointService>(MeetingPointService);
  });

  const validPayload: SearchMeetingPointsDto = {
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

  it('successfully calculates meeting points for valid Bengaluru trip', async () => {
    const response = await service.search(validPayload);

    expect(response.status).toBe('ok');
    expect(response.routes?.riderA).toBeDefined();
    expect(response.routes?.riderB).toBeDefined();
    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.recommendations.length).toBeLessThanOrEqual(3);

    const firstRec = response.recommendations[0];
    expect(firstRec).toHaveProperty('id');
    expect(firstRec).toHaveProperty('name');
    expect(firstRec).toHaveProperty('travel');
    expect(firstRec).toHaveProperty('detour');
    expect(firstRec.navigationUrl).toContain('destination=');
  });

  it('rejects identical rider IDs', async () => {
    const invalidPayload: SearchMeetingPointsDto = {
      ...validPayload,
      riders: [
        { id: 'rider-a', location: { lat: 12.9698, lng: 77.75 } },
        { id: 'rider-a', location: { lat: 12.9352, lng: 77.6245 } },
      ],
    };

    await expect(service.search(invalidPayload)).rejects.toThrow(BadRequestException);
  });

  it('returns no_candidates when detour constraint is zero and cannot be met', async () => {
    const tightPayload: SearchMeetingPointsDto = {
      ...validPayload,
      preferences: {
        priority: 'balanced_arrival',
        maxDetourMinutes: 0, // 0 detour impossible
        limit: 3,
      },
    };

    const response = await service.search(tightPayload);
    expect(response.status).toBe('no_candidates');
    expect(response.recommendations).toHaveLength(0);
    expect(response.warnings?.[0].code).toBe('NO_VALID_MEETING_POINT');
  });
});
