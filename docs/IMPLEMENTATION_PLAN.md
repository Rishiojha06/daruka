# Implementation Plan

## Weekend Ride MVP

## Phase 0 --- Validate external dependencies

Do this before significant coding: - Confirm selected provider supports
the required road-routing mode for motorcycles/two-wheelers in
Bengaluru. - Confirm traffic-aware duration support and availability. -
Confirm route geometry, matrix dimensions/limits, place categories and
pricing. - Confirm map rendering, attribution, caching and
data-retention terms. - Create restricted API keys and billing alerts. -
Record provider decision and date in `DECISIONS.md`.

Exit criteria: a small spike can fetch two routes to a destination,
return route geometry and evaluate several candidate durations.

## Phase 1 --- Repository foundation

Suggested monorepo:

``` text
weekend-ride/
  apps/
    web/
    api/
  packages/
    shared-types/  # optional; add only if it simplifies contract sharing
  docs/
  .env.example
  README.md
```

-   Use strict TypeScript.
-   Configure formatter/linter and scripts.
-   Add health endpoint to NestJS.
-   Add environment validation.
-   Add CI checks for lint, typecheck, tests and builds.
-   Keep frontend and backend independent enough to deploy separately.

Exit criteria: clean install, local run, CI green.

## Phase 2 --- Map UI and location selection

-   Build three location inputs.
-   Implement provider-backed autocomplete.
-   Add map pin selection.
-   Add explicit browser geolocation action.
-   Display start and destination markers.
-   Build responsive layout and loading/error states.

Exit criteria: user can select all locations without calling
meeting-point algorithm.

## Phase 3 --- Routing adapter

-   Implement provider interface and first adapter.
-   Fetch A→D and B→D routes.
-   Normalize geometry, distance and duration.
-   Render both routes on one map.
-   Add timeouts, stable error mapping and privacy-safe logs.

Exit criteria: deterministic route preview works with provider
integration tests.

## Phase 4 --- Algorithm

-   Implement route sampling.
-   Implement route-proximity candidate generation.
-   Implement deduplication and candidate pruning.
-   Implement matrix-based travel-time evaluation.
-   Implement detour calculations and scoring.
-   Implement no-candidate/partial-results behavior.
-   Keep algorithm functions pure where possible.

Exit criteria: required algorithm unit tests pass and candidate
evaluation is bounded.

## Phase 5 --- Place enrichment and recommendations

-   Query places near top candidates where provider support/terms
    permit.
-   Validate routability to the selected place where supported.
-   Return top three candidates.
-   Build recommendation cards and map selection.
-   Add navigation handoff.

Exit criteria: end-to-end happy path works.

## Phase 6 --- Hardening and real-world validation

-   Test error, timeout, quota and no-candidate paths.
-   Evaluate 20--30 real/sanitized route fixtures.
-   Tune scoring weights and sampling interval.
-   Measure provider calls and response latency.
-   Review privacy, API key restrictions, rate limiting and costs.
-   Add deployment documentation.

Exit criteria: acceptance criteria in PRD are met and limitations are
disclosed.

## Suggested issue sequence

1.  `chore: scaffold frontend and backend`
2.  `feat(api): add health endpoint and env validation`
3.  `feat(web): add three-location form`
4.  `feat(web): add map and location selection`
5.  `feat(api): add routing provider interface`
6.  `feat(api): fetch and normalize destination routes`
7.  `feat(web): render both destination routes`
8.  `feat(api): generate route-based candidate points`
9.  `feat(api): evaluate candidate travel times`
10. `feat(api): implement scoring and detour constraints`
11. `feat(api): enrich top candidates with places`
12. `feat(web): display ranked meeting points`
13. `feat(web): add navigation handoff`
14. `test: add route fixtures and e2e scenarios`
15. `docs: add setup, provider configuration and deployment guide`
