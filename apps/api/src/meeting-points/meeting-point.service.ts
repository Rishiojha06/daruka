import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  MeetingPointSearchResponse,
  RecommendationCandidate,
  RouteSummary,
} from '@weekend-ride/shared-types';
import { generateCandidatePoints } from '../algorithm/candidate.engine';
import { haversineDistanceMeters } from '../common/geo.utils';
import { CandidateEvaluationInput, scoreAndRankCandidates } from '../algorithm/scoring.engine';
import { ROUTING_PROVIDER, RoutingProvider } from '../routing/routing.types';
import { SearchMeetingPointsDto } from './dto/search-meeting-points.dto';

@Injectable()
export class MeetingPointService {
  private readonly logger = new Logger(MeetingPointService.name);

  constructor(
    @Inject(ROUTING_PROVIDER)
    private readonly routingProvider: RoutingProvider,
  ) {}

  async search(dto: SearchMeetingPointsDto): Promise<MeetingPointSearchResponse> {
    const [riderA, riderB] = dto.riders;

    // Validate distinct rider IDs
    if (riderA.id === riderB.id) {
      throw new BadRequestException('Rider IDs must be distinct.');
    }

    const preferences = dto.preferences || {
      priority: 'balanced_arrival',
      maxDetourMinutes: 15,
      limit: 3,
    };

    const maxDetourSeconds = (preferences.maxDetourMinutes ?? 15) * 60;
    const outputLimit = preferences.limit ?? 3;

    // Step 1: Request road routes for both riders to shared destination
    const [routeAResult, routeBResult] = await Promise.all([
      this.routingProvider.getRoute(riderA.location, dto.destination),
      this.routingProvider.getRoute(riderB.location, dto.destination),
    ]);

    const routeSummaries: { riderA: RouteSummary; riderB: RouteSummary } = {
      riderA: {
        distanceMeters: routeAResult.distanceMeters,
        durationSeconds: routeAResult.durationSeconds,
        geometry: routeAResult.geometry,
        encodedPolyline: routeAResult.encodedPolyline,
      },
      riderB: {
        distanceMeters: routeBResult.distanceMeters,
        durationSeconds: routeBResult.durationSeconds,
        geometry: routeBResult.geometry,
        encodedPolyline: routeBResult.encodedPolyline,
      },
    };

    // Step 2: Generate candidate meeting points from route geometries (bounded to max 10 candidates)
    const candidatePoints = generateCandidatePoints(
      routeAResult,
      routeBResult,
      dto.destination,
      { maxCandidates: 10 },
    );

    if (candidatePoints.length === 0) {
      return {
        status: 'no_candidates',
        generatedAt: new Date().toISOString(),
        routes: routeSummaries,
        recommendations: [],
        warnings: [
          {
            code: 'NO_VALID_MEETING_POINT',
            message: 'No meeting point met the current route and detour constraints. Try increasing the detour limit or selecting different locations.',
          },
        ],
      };
    }

    // Step 3: Evaluate matrix travel times
    // Approach Matrix: 2 origins (Rider A, Rider B) x N candidate destinations
    // Onward Matrix: N candidate origins x 1 destination
    const candidateLocations = candidatePoints.map((c) => c.location);

    const [approachMatrix, onwardMatrix] = await Promise.all([
      this.routingProvider.getRouteMatrix(
        [riderA.location, riderB.location],
        candidateLocations,
      ),
      this.routingProvider.getRouteMatrix(
        candidateLocations,
        [dto.destination],
      ),
    ]);

    // Map matrix cells to evaluation inputs
    const evalInputs: CandidateEvaluationInput[] = [];

    for (let i = 0; i < candidatePoints.length; i++) {
      const point = candidatePoints[i];

      // approach for rider A (originIndex 0, destinationIndex i)
      const cellA = approachMatrix.find(
        (m) => m.originIndex === 0 && m.destinationIndex === i,
      );
      // approach for rider B (originIndex 1, destinationIndex i)
      const cellB = approachMatrix.find(
        (m) => m.originIndex === 1 && m.destinationIndex === i,
      );
      // onward to destination (originIndex i, destinationIndex 0)
      const cellOnward = onwardMatrix.find(
        (m) => m.originIndex === i && m.destinationIndex === 0,
      );

      const isReachable =
        cellA?.status === 'ok' &&
        cellB?.status === 'ok' &&
        cellOnward?.status === 'ok';

      evalInputs.push({
        id: point.id,
        location: point.location,
        tASeconds: cellA?.durationSeconds ?? -1,
        tBSeconds: cellB?.durationSeconds ?? -1,
        tOnwardSeconds: cellOnward?.durationSeconds ?? -1,
        directASeconds: routeAResult.durationSeconds,
        directBSeconds: routeBResult.durationSeconds,
        isReachable,
      });
    }

    // Step 4: Apply scoring, constraints, and ranking
    const scoredCandidates = scoreAndRankCandidates(evalInputs, maxDetourSeconds);

    if (scoredCandidates.length === 0) {
      return {
        status: 'no_candidates',
        generatedAt: new Date().toISOString(),
        routes: routeSummaries,
        recommendations: [],
        warnings: [
          {
            code: 'NO_VALID_MEETING_POINT',
            message: 'No meeting point met the current route and detour constraints. Try increasing the detour limit or selecting different locations.',
          },
        ],
      };
    }

    // Step 5: Enrich top candidates (up to limit) with place data
    const topScored = scoredCandidates.slice(0, outputLimit);
    const enrichedRecommendations: RecommendationCandidate[] = [];

    for (let i = 0; i < topScored.length; i++) {
      const scored = topScored[i];
      let placeName = 'Roadside Meeting Point';
      let placeCategory = 'roadside';

      if (this.routingProvider.searchPlaces) {
        try {
          const places = await this.routingProvider.searchPlaces(
            scored.location,
            ['gas_station', 'cafe', 'parking'],
            1500,
          );
          if (places.length > 0) {
            placeName = places[0].name;
            placeCategory = places[0].category || 'convenience';
          }
        } catch (err) {
          this.logger.warn(`Place enrichment failed for candidate ${scored.id}: ${(err as Error).message}`);
        }
      }

      enrichedRecommendations.push({
        id: `rec-${i + 1}`,
        name: placeName,
        category: placeCategory,
        location: scored.location,
        travel: {
          riderASeconds: scored.tASeconds,
          riderBSeconds: scored.tBSeconds,
          arrivalDifferenceSeconds: scored.arrivalDifferenceSeconds,
          toDestinationSeconds: scored.tOnwardSeconds,
        },
        detour: {
          riderASeconds: scored.detourASeconds,
          riderBSeconds: scored.detourBSeconds,
        },
        score: scored.score,
        navigationUrl: this.routingProvider.buildDirectionsUrl(scored.location),
      });
    }

    // Align the displayed route polylines to whichever primary or alternative route
    // actually passes through/closest to the top-ranked meeting point.
    let displayRouteA = routeSummaries.riderA;
    let displayRouteB = routeSummaries.riderB;

    if (topScored.length > 0) {
      const topLoc = topScored[0].location;

      const allRoutesA = [routeAResult, ...(routeAResult.alternatives || [])];
      let minDistA = Infinity;
      for (const r of allRoutesA) {
        for (const pt of r.geometry) {
          const d = haversineDistanceMeters(pt, topLoc);
          if (d < minDistA) {
            minDistA = d;
            displayRouteA = {
              distanceMeters: r.distanceMeters,
              durationSeconds: r.durationSeconds,
              geometry: r.geometry,
              encodedPolyline: r.encodedPolyline,
            };
          }
        }
      }

      const allRoutesB = [routeBResult, ...(routeBResult.alternatives || [])];
      let minDistB = Infinity;
      for (const r of allRoutesB) {
        for (const pt of r.geometry) {
          const d = haversineDistanceMeters(pt, topLoc);
          if (d < minDistB) {
            minDistB = d;
            displayRouteB = {
              distanceMeters: r.distanceMeters,
              durationSeconds: r.durationSeconds,
              geometry: r.geometry,
              encodedPolyline: r.encodedPolyline,
            };
          }
        }
      }
    }

    return {
      status: 'ok',
      generatedAt: new Date().toISOString(),
      routes: {
        riderA: displayRouteA,
        riderB: displayRouteB,
      },
      recommendations: enrichedRecommendations,
      warnings: [],
    };
  }
}
