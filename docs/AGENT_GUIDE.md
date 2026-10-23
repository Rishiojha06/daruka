# Coding Agent Guide

## Read before changing code

You are implementing Weekend Ride, a route-aware motorcycle
meeting-point finder. Follow `PRD.md`, `TDD.md`, `API_CONTRACT.md` and
`TEST_PLAN.md` as the project source of truth.

## Priority order

1.  Correctness and user safety.
2.  Explicit product requirements and API contract.
3.  Provider terms, privacy and security.
4.  Testability and maintainability.
5.  Performance and cost.
6.  Visual polish.

## Fixed decisions

-   React + Vite + TypeScript frontend.
-   NestJS + TypeScript backend.
-   REST API.
-   Shared destination is required.
-   The recommendation prioritizes balanced arrival times and controls
    detours.
-   One routing provider behind an adapter; no dual-provider integration
    in MVP.
-   No authentication, database, live tracking or in-app navigation in
    MVP.
-   Return up to three valid candidates.
-   Use seconds and metres internally and in API responses.
-   No fabricated locations, route times, place names or claims of
    safety.
-   Candidate count for matrix evaluation must be bounded (maximum 20
    for MVP).

## Required workflow for each task

1.  Read relevant documents and inspect existing code before editing.
2.  State a short implementation plan in the PR/commit summary.
3.  Implement the smallest complete vertical slice.
4.  Add/update tests in the same change.
5.  Run lint, typecheck, unit tests and builds available in the repo.
6.  Report exactly which commands ran and whether they passed. Never
    claim tests passed if not run.
7.  Update docs and API contract when behavior changes.
8.  Identify unresolved provider assumptions rather than silently
    guessing.

## Architecture rules

-   Keep provider-specific code inside the provider adapter.
-   Keep candidate generation and scoring independent of HTTP
    controllers and provider response models.
-   Prefer pure functions for distance calculations, detour
    calculations, filtering and scoring.
-   Validate external input at the API boundary.
-   Normalize provider failures to stable internal error codes.
-   Do not return raw provider error payloads to the browser.
-   Do not introduce microservices, event brokers, a database or
    authentication without an explicit product need.
-   Avoid speculative abstractions. Use an interface at the provider
    boundary because provider choice may change.

## Algorithm rules

-   Never use the geographic midpoint as the sole recommendation
    algorithm.
-   Route proximity is a candidate-generation signal, not proof of
    connectivity.
-   Evaluate candidates using actual provider travel-time estimates.
-   Penalize arrival-time imbalance first, then excessive approach
    duration and detour.
-   Apply the configured detour limit.
-   Check route feasibility to each candidate and onward to the
    destination.
-   Return no-candidate state when no valid candidate survives.
-   Never treat missing travel duration as zero.
-   Keep scoring units explicit and add unit tests for every ranking
    rule.
-   Explain approximate detour semantics in docs/UI.

## Provider integration rules

-   Verify current official provider documentation before coding API
    request shapes or travel modes.
-   Do not invent endpoints, request fields, quota limits or pricing.
-   Use environment variables for server credentials and placeholders
    only in `.env.example`.
-   Do not commit keys or log them.
-   Respect provider attribution, caching, storage and display terms.
-   Bound matrix request sizes and retries.

## Frontend rules

-   Mobile-first responsive design.
-   Accessible labels, keyboard navigation and visible focus.
-   Geolocation only after user action.
-   Manual location entry remains available.
-   Preserve form values after failures.
-   Show loading, no-result, partial-result and error states.
-   Label estimated times as estimates.
-   Do not claim a stop is safe or open without evidence.

## Definition of done

-   Acceptance criteria are met.
-   Relevant tests are added and pass.
-   Lint, typecheck and production build pass.
-   No secrets are committed.
-   API contract and docs reflect the implementation.
-   Errors are handled without fabricated results.
-   Final report lists changed files, tests run, known limitations and
    any assumptions still requiring validation.

## First task for an agent

Do not implement the full app in one pass. Start with Phase 0 in
`IMPLEMENTATION_PLAN.md`: verify provider capability, pricing/terms, and
run a minimal routing spike. Report findings and proposed provider
configuration before building the algorithm.
