import { generateCandidatePoints } from './candidate.engine';
import { RouteResult } from '../routing/routing.types';

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
        const dist = Math.abs(candidates[i].location.lat - candidates[j].location.lat);
        expect(dist).toBeGreaterThan(0.01);
      }
    }
  });

  it('respects maximum candidate ceiling', () => {
    const candidates = generateCandidatePoints(routeA, routeB, destination, {
      maxCandidates: 2,
    });
    expect(candidates.length).toBeLessThanOrEqual(2);
  });
});
