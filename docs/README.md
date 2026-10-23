# Weekend Ride --- Coding Agent Specification Pack

This pack is the implementation source of truth for the Weekend Ride
meeting-point finder MVP.

## Recommended reading order

1.  `PRD.md` --- product scope and acceptance criteria
2.  `TDD.md` --- architecture and algorithm design
3.  `API_CONTRACT.md` --- API request/response contracts
4.  `TEST_PLAN.md` --- required tests and quality gates
5.  `IMPLEMENTATION_PLAN.md` --- incremental build sequence
6.  `AGENT_GUIDE.md` --- instructions for coding agents
7.  `DECISIONS.md` --- fixed decisions and open questions

## Project summary

A mobile-friendly web app accepts two rider starting locations and one
shared destination. It recommends a practical meeting point that
balances estimated arrival times while controlling detours and ensuring
the point is reachable and suitable for stopping.

## MVP defaults

-   Frontend: React, Vite, TypeScript.
-   Backend: NestJS, TypeScript, REST.
-   Maps provider: Google Maps Platform is the initial candidate;
    validate actual API support, two-wheeler route mode availability,
    regional coverage, pricing and terms before implementation. Keep
    provider-specific code behind an interface.
-   Persistence: none required for the first MVP.
-   Authentication: none for the first MVP.
-   Live tracking: out of scope.
-   Ranking: arrival-time balance is primary; excessive detours and
    invalid stops are penalized or filtered.
-   Output: up to three recommendations, route previews, time/distance
    estimates, and navigation handoff.

## Important implementation principle

Do not claim a meeting point is optimal unless the algorithm actually
evaluated candidates and their travel times. Do not fabricate place
names, travel durations, route geometry, or safety claims. If the
provider or algorithm cannot find valid candidates, return a clear
no-good-candidate result with actionable guidance.
