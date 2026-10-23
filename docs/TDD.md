# Technical Design Document (TDD)

## Weekend Ride --- Meeting-Point Finder

-   Status: Proposed technical design
-   Scope: MVP architecture, routing abstraction, candidate algorithm,
    API, testing and deployment
-   This document describes intended design. Provider capabilities and
    quotas must be verified against current official documentation
    before implementation.

## 1. Architecture decisions

-   Frontend: React + Vite + TypeScript.
-   Backend: NestJS + TypeScript, modular monolith.
-   API style: versioned REST JSON.
-   Maps provider: start with one provider behind an internal adapter.
    Google Maps Platform is the initial candidate; verify
    motorcycle/two-wheeler route support and regional availability.
-   Database: none for MVP.
-   Authentication: none for MVP.
-   Deployment: static frontend plus a separately deployed NestJS API.
-   Testing: unit tests for pure algorithmic logic; integration tests
    with mocked provider adapters; end-to-end tests for main user
    journey.
-   No microservices, event broker or cache infrastructure required
    initially.

## 2. System context

The browser collects three locations, renders the map, and submits a
search request to NestJS. The backend validates input, calls the routing
adapter for route geometry and travel-time data, generates and scores
candidates, optionally enriches the best candidates with place data, and
returns recommendations. The browser displays results and creates a
navigation handoff.

## 3. Component responsibilities

### Frontend

-   Location search and selected-coordinate state.
-   Explicit geolocation request.
-   Map and route rendering.
-   Search request lifecycle and error handling.
-   Recommendation cards and navigation links.
-   No secret server credentials.

### NestJS API

-   DTO validation and request bounds.
-   Orchestration and provider error normalization.
-   Candidate generation and scoring.
-   API rate limiting and safe logging.
-   Response shaping independent of provider-specific response formats.

### RoutingProvider interface

Define a provider-neutral interface for: -
`getRoute(origin, destination, travelMode)`: geometry, duration,
distance and metadata. -
`getRouteMatrix(origins, destinations, travelMode)`: duration/distance
per pair. - `searchPlaces(nearbyPoint, categories, radius)`: optional
nearby-place results. - `buildDirectionsUrl(origin, destination)`:
navigation handoff URL, if appropriate. Do not expose raw provider
response objects to the domain algorithm.

### MeetingPointService

-   Calls provider routes for both riders to destination.
-   Generates candidates from route geometries.
-   Evaluates a bounded number of candidates.
-   Applies constraints and scoring.
-   Enriches only top-ranked candidates with place data when possible.
-   Returns recommendation status and warnings.

## 4. Request lifecycle

1.  Validate three coordinates and preference bounds.
2.  Obtain routes A→D and B→D, including route geometry.
3.  If either required route fails, return a normalized error; do not
    create a recommendation from incomplete data.
4.  Generate candidates from route geometry and road-accessible places
    near promising sections.
5.  Deduplicate and filter candidates; cap the candidate set.
6.  Evaluate route durations A→candidate and B→candidate. Also obtain or
    estimate candidate→destination travel time for onward-route
    viability.
7.  Reject candidates with missing durations, impossible access or
    detours over the configured limit.
8.  Score remaining candidates.
9.  Enrich top candidates with place data and validate available access
    information.
10. Return at most three candidates, route previews, timestamps and any
    partial-result warnings.

## 5. Candidate-generation strategy

Use a coarse-to-fine method.

### Phase 1: route geometry

-   Decode provider route geometry into ordered coordinates.
-   Normalize coordinates and handle antimeridian-safe distance
    calculations if the product expands globally.
-   Sample route geometry at a configurable distance interval. Start
    around 500--1,000 metres, then tune with fixture-based tests.
-   Use a spatial index or a bounded pairwise comparison to find nearby
    sections of the two routes.
-   Treat proximity as a signal only. It does not establish that roads
    connect or that a stop is accessible.

### Phase 2: candidate creation

Candidate sources, in preferred order: 1. Road-network convergence or
shared route sections, if provider data makes these identifiable. 2.
Road-accessible points near sections where routes are close. 3. Nearby
known stopping places (fuel stations, cafes, parking areas) around
promising sections. 4. If routes do not converge, generate alternative
points near the corridor between routes and evaluate detours; return
no-result if none meet constraints.

Do not blindly average route coordinates. Do not assume the geometric
midpoint is on a legal road. Do not assume two routes can connect
because their polylines are close.

### Phase 3: deduplication and pruning

-   Deduplicate candidates within a configurable spatial radius.
-   Remove candidates beyond a maximum distance from either route unless
    they are deliberate alternate corridor candidates.
-   Limit matrix evaluation to at most 20 candidates for the MVP.
-   Preserve candidate source and generation metadata for debugging.
-   Do not use provider results in ways prohibited by its terms.

### Phase 4: road and onward validation

-   Use route matrix/directions calls to check that each rider can reach
    the candidate.
-   Check candidate→destination route availability.
-   A nearby place should not be considered valid merely because its
    coordinates are close; validate routability/access where supported.
-   If provider data cannot verify safe stopping, phrase the UI as
    "suggested place" and do not claim safety.

## 6. Scoring model

For candidate M: - `tA`: estimated travel time from Rider A start to M,
in seconds. - `tB`: estimated travel time from Rider B start to M, in
seconds. - `directA`: estimated direct travel time A→D. - `directB`:
estimated direct travel time B→D. - `detourA = max(0, tA - directA)`. -
`detourB = max(0, tB - directB)`. - `arrivalGap = abs(tA - tB)`. -
`totalApproach = tA + tB`. - `onward`: candidate→destination duration,
when available.

Initial scoring formula:
`score = alpha * arrivalGap + beta * max(tA, tB) + gamma * (detourA + detourB)`

Lower score is better. Initial relative weighting should make arrival
balance the primary objective. Do not choose arbitrary weights without
documenting units and validating test fixtures. One practical option is
to normalize each term to minutes and use documented configurable
weights,
e.g. `score = 3 * arrivalGapMinutes + 1 * maxApproachMinutes + 1 * totalDetourMinutes`;
these are starting weights for experiments, not universal truths.

Constraints: - Reject candidates where either rider cannot route to M. -
Reject candidates where candidate→destination cannot route. - Reject
candidates where either detour exceeds configured maximum, default 15
minutes. - Reject candidates with malformed or non-positive provider
durations. - Consider a hard maximum arrival gap only if product testing
supports it; otherwise rank by score. - Keep all scoring logic pure and
independently testable.

Why not minimize arrival gap alone? It can choose a point very far away
for both riders. The maximum approach duration and detour constraints
protect against that outcome.

## 7. Important interpretation of detour

Comparing `time(start→candidate)` to `time(start→destination)` does not
always measure the true detour of meeting en route, because those are
separate route requests and may take different paths. It is a useful
initial penalty but must be labelled approximate. A stronger later model
can compare: - baseline route duration start→destination, - route
start→candidate plus candidate→destination, - combined journey duration
if rider continues from candidate to destination. Use the routing
provider to obtain candidate→destination duration, and document that
traffic snapshots can differ.

## 8. Provider abstraction

Use a domain interface, e.g.:

``` ts
export type Coordinates = { lat: number; lng: number };

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline?: string;
  geometry?: Coordinates[];
  providerMetadata?: {
    trafficAware?: boolean;
    travelMode?: string;
  };
}

export interface RouteMatrixCell {
  originIndex: number;
  destinationIndex: number;
  distanceMeters?: number;
  durationSeconds?: number;
  status: 'ok' | 'unreachable' | 'error';
}

export interface PlaceCandidate {
  providerPlaceId?: string;
  name?: string;
  category?: string;
  location: Coordinates;
  address?: string;
}

export interface RoutingProvider {
  getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult>;
  getRouteMatrix(
    origins: Coordinates[],
    destinations: Coordinates[],
  ): Promise<RouteMatrixCell[]>;
  searchPlaces?(
    center: Coordinates,
    categories: string[],
    radiusMeters: number,
  ): Promise<PlaceCandidate[]>;
  buildDirectionsUrl(
    origin: Coordinates,
    destination: Coordinates,
  ): string;
}
```

This is illustrative TypeScript. Adapt to the chosen provider's actual
request model and supported travel modes. Avoid leaking
provider-specific types outside the adapter.

## 9. API design

`POST /api/v1/meeting-points/search` - Request body: two rider
coordinates, destination coordinates, optional preferences. - Response:
status, route summaries, up to three recommendations, generation
timestamp, warnings. - Validate all inputs with NestJS DTOs and
class-validator (or the repo's chosen validation library). - Enforce
limits: candidate limit no more than 20, output limit no more than 3,
detour preference within a documented safe range. - Use consistent error
envelope with stable machine-readable codes. - Do not return provider
API keys or raw provider error payloads.

## 10. Reliability and timeouts

-   Use bounded timeouts for provider calls.
-   Handle each provider call with explicit error normalization.
-   Avoid unbounded retries. Only retry transient failures, with a small
    retry count and backoff, and only where it does not multiply cost
    unexpectedly.
-   Use request cancellation where supported.
-   If route retrieval fails, return a safe, actionable error.
-   If candidate enrichment fails after route evaluation, optionally
    return coordinate-based results with an explicit warning if they are
    still valid; do not invent a named place.
-   Track provider latency, failure class and candidate counts without
    logging precise user locations.

## 11. Security and privacy

-   Keep server API keys in environment variables or a secret manager.
-   Restrict browser API keys by referrer and allowed APIs.
-   Use separate credentials for browser map rendering and server
    routing where provider configuration supports it.
-   Never commit `.env` files. Provide `.env.example` containing
    placeholders only.
-   Validate and bound request inputs; rate-limit the search endpoint.
-   Avoid logging exact coordinates or raw provider responses in
    production.
-   Use HTTPS in deployment.
-   Review provider terms for caching, storage, attribution and use of
    results.
-   No location persistence by default.

## 12. Observability

Record structured, privacy-safe metrics: - request duration, - provider
operation and status, - number of generated/evaluated/valid
candidates, - no-candidate reason code, - result count, - approximate
provider cost if calculable. Do not log precise start/destination
coordinates by default.

## 13. Deployment

-   Frontend: static hosting.
-   Backend: Node-compatible managed runtime/container.
-   Configure CORS for known frontend origins.
-   Use environment-based configuration and health endpoint.
-   Set provider API quotas and billing alerts before production.
-   Do not expose a production endpoint before abuse/rate limiting is
    configured.

## 14. Open technical questions

-   Verify two-wheeler routing mode and traffic support in Bengaluru for
    selected provider.
-   Confirm matrix request limits, quotas, price and regional behavior.
-   Decide whether a provider can reliably generate road-accessible
    candidates or whether a separate road-network source is needed.
-   Determine whether provider place search permits required category
    queries and how place data can be stored/displayed.
-   Validate the first scoring weights with real test trips.
