# Test Plan and Quality Gates

## Weekend Ride --- Meeting-Point Finder

## 1. Test pyramid

1.  Unit tests: coordinate validation, candidate deduplication, detour
    calculations, scoring and ranking.
2.  Provider-adapter tests: mocked HTTP responses, error mapping,
    timeouts, route matrix partial failures.
3.  Service integration tests: complete search orchestration with
    deterministic provider fixtures.
4.  Frontend component tests: validation, loading, results, errors and
    navigation handoff.
5.  End-to-end tests: primary user journey and important failures using
    a mocked backend/provider.
6.  Manual route validation: real trips in Bengaluru, with expected
    results reviewed by a human.

## 2. Required algorithm unit tests

-   Equal arrival times and similar detours rank highly.
-   A small arrival gap wins over a larger gap when other factors are
    comparable.
-   A candidate with a very small arrival gap but extreme approach time
    loses to a practical alternative.
-   Candidate exceeding Rider A's detour limit is rejected.
-   Candidate exceeding Rider B's detour limit is rejected.
-   Unreachable candidate is rejected.
-   Missing duration is rejected rather than interpreted as zero.
-   Invalid/negative duration is rejected.
-   Duplicate candidates within the configured radius are deduplicated.
-   Empty candidate list returns `no_candidates`.
-   Stable tie-breaking makes ranking deterministic.
-   Formula unit conversion (seconds/minutes) is correct.
-   Candidate→destination route failure is handled according to
    documented policy.
-   Scoring values are finite and cannot be NaN/Infinity.

## 3. Provider adapter tests

-   Successful route response maps to internal model correctly.
-   Successful matrix response maps each origin/destination pair
    correctly.
-   Unreachable route is not confused with provider/system failure.
-   Partial matrix failures are represented explicitly.
-   Rate limit, quota, auth and timeout failures map to stable internal
    errors.
-   Malformed provider response is handled safely.
-   API key is never included in logs or error responses.
-   Place search failure does not fabricate a place.
-   Directions URL correctly encodes coordinates.

## 4. API/service integration tests

-   Valid request calls both routes to destination.
-   Candidate evaluation is bounded to at most 20 candidates.
-   Result limit is capped at 3.
-   Missing/invalid coordinates are rejected before provider calls.
-   If either initial route fails, no fabricated recommendations are
    returned.
-   Provider calls use configured travel mode.
-   Detour preferences are bounded.
-   Output fields use seconds/metres and UTC timestamps.
-   A no-candidate result is distinct from a provider outage.
-   Rate limiting works.
-   Logs do not contain raw coordinates by default.

## 5. Frontend tests

-   All three location fields are required.
-   User can choose a location via search and/or map pin.
-   Geolocation is requested only after user action.
-   Denied geolocation shows manual-entry fallback.
-   Search button is disabled while pending.
-   Results display both rider times, arrival gap and detours.
-   No-candidate state offers a clear next step.
-   Provider/network failure preserves inputs.
-   Navigation link opens the expected destination.
-   Keyboard users can operate inputs and candidate selection.
-   Layout remains usable at narrow mobile widths.

## 6. End-to-end scenarios

### E2E-01: happy path

Enter three valid locations → submit → view both routes → view ranked
candidates → select one → open navigation.

### E2E-02: invalid input

Leave a location blank → validation appears → no API request occurs.

### E2E-03: no candidate

Provider fixtures produce no feasible candidates → no-result state
appears, no invented marker is shown.

### E2E-04: route provider unavailable

Mock route API failure → actionable error appears, input values remain.

### E2E-05: location permission denied

Deny geolocation → user can still enter all locations manually.

### E2E-06: partial place enrichment

Routing yields valid coordinate candidates but place search fails → show
only valid coordinate-based candidates with an explicit warning, if
policy permits; never invent a place name.

## 7. Real-world evaluation dataset

Create 20--30 manually curated origin A, origin B and destination trip
fixtures around Bengaluru. Do not commit personal location data without
consent. Store sanitized coordinates or mocked route geometries where
possible. Include: - nearby origins, - opposite-side origins, - route
convergence, - late route convergence, - non-converging routes, -
highway-oriented destinations, - candidates with severe detours, -
no-valid-candidate cases.

Review the top three recommendations manually for route reachability,
reasonable detour and suitability. Do not assert a fixed universal
arrival-gap target until the dataset establishes a baseline.

## 8. Quality gates

Before merging: - TypeScript typecheck passes. - Linter passes. - Unit
and integration tests pass. - Frontend production build passes. -
Backend production build passes. - No secrets committed. - API contract
and docs updated if response semantics change. - At least one regression
test is added for each fixed bug. - Provider costs/quotas are bounded
and candidate count is capped.
