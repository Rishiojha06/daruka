import { Coordinates } from '@weekend-ride/shared-types';
import { haversineDistanceMeters, samplePolyline } from '../common/geo.utils';
import { RouteResult } from '../routing/routing.types';

export interface GeneratedCandidatePoint {
  id: string;
  location: Coordinates;
  source: 'convergence' | 'proximity' | 'corridor_seed';
  sampleDistanceMeters?: number;
  distToDest?: number;
}

export interface CandidateGenerationOptions {
  sampleIntervalMeters?: number;
  dedupRadiusMeters?: number;
  maxCandidates?: number;
  maxSeparationMeters?: number;
}

const DEFAULT_OPTIONS: Required<CandidateGenerationOptions> = {
  sampleIntervalMeters: 1000,
  dedupRadiusMeters: 2500,
  maxCandidates: 10,
  maxSeparationMeters: 3500,
};

/**
 * Generates bounded, deduplicated road-based candidate meeting points from route geometries,
 * sampling across all primary and alternative route combinations (A_i x B_j).
 */
export function generateCandidatePoints(
  routeA: RouteResult,
  routeB: RouteResult,
  destination: Coordinates,
  options: CandidateGenerationOptions = {},
): GeneratedCandidatePoint[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawCandidates: GeneratedCandidatePoint[] = [];

  // Gather all primary and alternative geometries for both riders
  const geometriesA = [routeA.geometry, ...(routeA.alternatives?.map((a) => a.geometry) || [])];
  const geometriesB = [routeB.geometry, ...(routeB.alternatives?.map((b) => b.geometry) || [])];

  const sampledListA = geometriesA.map((g) => samplePolyline(g, opts.sampleIntervalMeters));
  const sampledListB = geometriesB.map((g) => samplePolyline(g, opts.sampleIntervalMeters));

  let candidateIndex = 1;

  // Pass 1: Cross-route convergence & proximity across all route alternative combinations (A_i x B_j)
  for (let aIdx = 0; aIdx < sampledListA.length; aIdx++) {
    const sampledA = sampledListA[aIdx];
    for (let bIdx = 0; bIdx < sampledListB.length; bIdx++) {
      const sampledB = sampledListB[bIdx];

      // Only evaluate vertices away from origin (skip first 2km from starts)
      for (let i = 2; i < sampledA.length; i++) {
        const ptA = sampledA[i];
        const distDestA = haversineDistanceMeters(ptA, destination);
        if (distDestA < 1500) continue;

        for (let j = 2; j < sampledB.length; j++) {
          const ptB = sampledB[j];
          const distDestB = haversineDistanceMeters(ptB, destination);
          if (distDestB < 1500) continue;

          const separation = haversineDistanceMeters(ptA, ptB);

          // If routes are within separation threshold
          if (separation <= opts.maxSeparationMeters) {
            rawCandidates.push({
              id: `cand-${candidateIndex++}`,
              location: ptA, // Verified route vertex guaranteeing road snapping
              source: separation < 500 ? 'convergence' : 'proximity',
              sampleDistanceMeters: separation,
              distToDest: distDestA,
            });

            // If separation is noticeable, also evaluate road vertex from Route B
            if (separation > 300) {
              rawCandidates.push({
                id: `cand-${candidateIndex++}`,
                location: ptB,
                source: 'proximity',
                sampleDistanceMeters: separation,
                distToDest: distDestB,
              });
            }
          }
        }
      }
    }
  }

  // Pass 2: If no convergence/proximity candidates found across any alternatives
  // Inject corridor candidates along midpoint vertices of each primary route
  if (rawCandidates.length === 0) {
    const primaryA = sampledListA[0] || [];
    const primaryB = sampledListB[0] || [];
    const midIndexA = Math.floor(primaryA.length * 0.5);
    const midIndexB = Math.floor(primaryB.length * 0.5);

    if (primaryA[midIndexA]) {
      rawCandidates.push({
        id: `cand-${candidateIndex++}`,
        location: primaryA[midIndexA],
        source: 'corridor_seed',
        distToDest: haversineDistanceMeters(primaryA[midIndexA], destination),
      });
    }
    if (primaryB[midIndexB]) {
      rawCandidates.push({
        id: `cand-${candidateIndex++}`,
        location: primaryB[midIndexB],
        source: 'corridor_seed',
        distToDest: haversineDistanceMeters(primaryB[midIndexB], destination),
      });
    }
  }

  // Sort candidates by earliest point along the corridor (highest distance to destination)
  // This guarantees candidate slots are not monopolized by late convergence near the finish line,
  // ensuring early, mid, and late meeting options along the route are evenly considered.
  rawCandidates.sort((a, b) => (b.distToDest ?? 0) - (a.distToDest ?? 0));

  // Pass 3: Deduplication by spatial radius
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
