import { generateCandidatePoints } from './candidate.engine';
import { RouteResult } from '../routing/routing.types';
import { haversineDistanceMeters } from '../common/geo.utils';

describe('CandidateGenerationEngine', () => {
  const originA = { lat: 12.9698, lng: 77.75 }; // Whitefield
  const originB = { lat: 12.9352, lng: 77.6245 }; // Koramangala
  const destination = { lat: 13.3702, lng: 77.6835 }; // Nandi Hills

  // Shared highway points (NH 44 near Hebbal / Yelahanka)
  const sharedPoint1 = { lat: 13.045, lng: 77.6 };
  const sharedPoint2 = { lat: 13.1, lng: 77.6 };
  const sharedPoint3 = { lat: 13.15, lng: 77.6 };

  const routeA: RouteResult = {
    distanceMeters: 45000,
    durationSeconds: 3600,
    geometry: [
      originA,
      { lat: 13.0, lng: 77.7 },
      sharedPoint1,
      sharedPoint2,
      sharedPoint3,
      destination,
    ],
  };

  const routeB: RouteResult = {
    distanceMeters: 40000,
    durationSeconds: 3200,
    geometry: [
      originB,
      { lat: 12.98, lng: 77.61 },
      sharedPoint1,
      sharedPoint2,
      sharedPoint3,
      destination,
    ],
  };

  it('generates candidates where routes converge', () => {
    const candidates = generateCandidatePoints(routeA, routeB, destination);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.length).toBeLessThanOrEqual(10);
  });

  it('deduplicates nearby candidate points along the same highway', () => {
    const candidates = generateCandidatePoints(routeA, routeB, destination, {
      dedupRadiusMeters: 3000,
      maxCandidates: 5,
    });

    // Check that no two returned candidates are within 3000m of each other
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const dist = haversineDistanceMeters(candidates[i].location, candidates[j].location);
        expect(dist).toBeGreaterThanOrEqual(2500);
      }
    }
  });

  it('respects maximum candidate ceiling', () => {
    const candidates = generateCandidatePoints(routeA, routeB, destination, {
      maxCandidates: 2,
    });
    expect(candidates.length).toBeLessThanOrEqual(2);
  });
  it('identifies candidates from alternative routes when primary routes diverge', () => {
    const divergentRouteA: RouteResult = {
      distanceMeters: 50000,
      durationSeconds: 3800,
      geometry: [
        originA,
        { lat: 13.0, lng: 77.8 },
        { lat: 13.1, lng: 77.8 },
        { lat: 13.2, lng: 77.8 },
        destination,
      ],
      alternatives: [
        {
          distanceMeters: 46000,
          durationSeconds: 3700,
          geometry: [
            originA,
            { lat: 13.0, lng: 77.7 },
            sharedPoint1,
            sharedPoint2,
            sharedPoint3,
            destination,
          ],
        },
      ],
    };

    const candidates = generateCandidatePoints(divergentRouteA, routeB, destination);
    expect(candidates.length).toBeGreaterThan(0);
    const foundShared = candidates.some((c) => Math.abs(c.location.lat - sharedPoint1.lat) < 0.05);
    expect(foundShared).toBe(true);
  });

});
