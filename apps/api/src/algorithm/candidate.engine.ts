import { Coordinates } from '@weekend-ride/shared-types';
import { haversineDistanceMeters, samplePolyline } from '../common/geo.utils';
import { RouteResult } from '../routing/routing.types';

export interface GeneratedCandidatePoint {
  id: string;
  location: Coordinates;
  source: 'convergence' | 'proximity' | 'corridor_seed';
  sampleDistanceMeters?: number;
}

export interface CandidateGenerationOptions {
  sampleIntervalMeters?: number;
  dedupRadiusMeters?: number;
  maxCandidates?: number;
}

const DEFAULT_OPTIONS: Required<CandidateGenerationOptions> = {
  sampleIntervalMeters: 1000,
  dedupRadiusMeters: 2500,
  maxCandidates: 10,
};

/**
 * Generates bounded, deduplicated road-based candidate meeting points from route geometries.
 */
export function generateCandidatePoints(
  routeA: RouteResult,
  routeB: RouteResult,
  destination: Coordinates,
  options: CandidateGenerationOptions = {},
): GeneratedCandidatePoint[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawCandidates: GeneratedCandidatePoint[] = [];

  const sampledA = samplePolyline(routeA.geometry, opts.sampleIntervalMeters);
  const sampledB = samplePolyline(routeB.geometry, opts.sampleIntervalMeters);

  let candidateIndex = 1;

  // Pass 1: Identify direct convergence / proximity between sampled vertices
  // Only evaluate pairs not too close to origin (at least 2km away from starts)
  for (let i = 2; i < sampledA.length; i++) {
    const ptA = sampledA[i];
    // Exclude points extremely close to destination (< 1.5 km) as meeting at the destination defeats the purpose
    if (haversineDistanceMeters(ptA, destination) < 1500) continue;

    for (let j = 2; j < sampledB.length; j++) {
      const ptB = sampledB[j];
      if (haversineDistanceMeters(ptB, destination) < 1500) continue;

      const separation = haversineDistanceMeters(ptA, ptB);

      // If routes are close (within 2 km of each other)
      if (separation <= 2000) {
        rawCandidates.push({
          id: `cand-${candidateIndex++}`,
          location: ptA, // Use verified route vertex to guarantee road snapping (Phase 0 Gap 2 fix)
          source: separation < 500 ? 'convergence' : 'proximity',
          sampleDistanceMeters: separation,
        });
      }
    }
  }

  // Pass 2: If no convergence/proximity candidates found (e.g. routes completely divergent until destination)
  // Inject corridor candidates along midpoint vertices of each route (Phase 0 Gap 4 fix)
  if (rawCandidates.length === 0) {
    const midIndexA = Math.floor(sampledA.length * 0.5);
    const midIndexB = Math.floor(sampledB.length * 0.5);

    if (sampledA[midIndexA]) {
      rawCandidates.push({
        id: `cand-${candidateIndex++}`,
        location: sampledA[midIndexA],
        source: 'corridor_seed',
      });
    }
    if (sampledB[midIndexB]) {
      rawCandidates.push({
        id: `cand-${candidateIndex++}`,
        location: sampledB[midIndexB],
        source: 'corridor_seed',
      });
    }
  }

  // Pass 3: Deduplication by spatial radius (Phase 0 Gap 3 fix)
  const deduplicated: GeneratedCandidatePoint[] = [];

  for (const cand of rawCandidates) {
    const isTooClose = deduplicated.some(
      (existing) => haversineDistanceMeters(existing.location, cand.location) < opts.dedupRadiusMeters,
    );

    if (!isTooClose) {
      deduplicated.push(cand);
    }

    if (deduplicated.length >= opts.maxCandidates) {
      break;
    }
  }

  return deduplicated;
}
