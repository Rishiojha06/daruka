# Architecture Decision Records and Open Questions

## ADR-001: Frontend stack

**Decision:** React + Vite + TypeScript. **Reason:** Familiar, fast
iteration, good fit for an interactive map interface. **Status:**
Accepted.

## ADR-002: Backend architecture

**Decision:** NestJS modular monolith with REST API. **Reason:** Clear
boundaries and testable services without premature distributed-system
complexity. **Status:** Accepted.

## ADR-003: Shared destination is required

**Decision:** Both riders enter a start location and the same final
destination. **Reason:** Meeting-point recommendations must account for
both routes and onward travel. **Status:** Accepted.

## ADR-004: Optimize balanced arrival time

**Decision:** Primary objective is to minimize absolute arrival-time
difference. Approach time and detours are secondary
objectives/constraints. **Reason:** Both riders should reach the meeting
point at roughly the same time without either being forced into an
excessive detour. **Status:** Accepted; weights require empirical
tuning.

## ADR-005: Provider adapter

**Decision:** Integrate one provider initially behind a provider-neutral
interface: Google Maps Platform (Routes API v2, Compute Route Matrix v2,
Places API New, Maps JavaScript API).
**Verification Date:** 2026-10-23 (Phase 0).
**Findings:**
- `TWO_WHEELER` mode is supported in India (`IN`), with traffic-aware routing.
- Two-wheeler requests trigger the Enterprise billing tier ($15.00/1,000 requests or matrix elements).
- Beta UI disclaimer is mandatory when presenting two-wheeler routes.
- Front-end map rendering must use Google Maps to comply with Google Maps Platform Terms (cannot display Google route geometry on non-Google maps).
**Status:** Accepted for MVP behind `RoutingProvider` domain abstraction.

## ADR-006: No database for MVP

**Decision:** Do not persist ride sessions in the first version.
**Reason:** The core value can be validated without accounts, history or
live tracking. **Status:** Accepted.

## ADR-007: Bounded candidate evaluation

**Decision:** Evaluate no more than 20 candidates in the MVP.
**Reason:** Keep provider latency and costs bounded. **Status:**
Accepted as an application-level limit; provider's current matrix limits
must be verified.

## ADR-008: No unsupported safety guarantees

**Decision:** The app can recommend a place but cannot guarantee safe
stopping, legal parking, access or opening status without reliable data.
**Reason:** Geographical proximity and place listings do not establish
real-world suitability. **Status:** Accepted.

## Open questions to resolve before production

1.  **[Resolved Phase 0 - 2026-10-23]** Does the selected provider support motorcycle/two-wheeler routing in Bengaluru, including the needed route geometry and duration fields?
    - *Yes.* Google Routes API supports `travelMode: "TWO_WHEELER"` in India (`IN`). It returns polyline geometry (`routes.polyline.encodedPolyline`) and duration/distance. Classified as Beta by Google; mandatory UI disclaimer required.
2.  **[Resolved Phase 0 - 2026-10-23]** Which traffic-aware travel-time option is available and appropriate?
    - *`routingPreference: "TRAFFIC_AWARE"`* is supported with `TWO_WHEELER`. `TRAFFIC_AWARE_OPTIMAL` is also supported but reduces matrix element limits from 625 to 100.
3.  **[Resolved Phase 0 - 2026-10-23]** What are the provider's current route matrix limits, pricing, quota and retry guidance?
    - Matrix limit: 625 elements (origins × destinations) or 100 elements for `TRAFFIC_AWARE_OPTIMAL`.
    - Pricing: `TWO_WHEELER` triggers **Routes: Compute Route Matrix Enterprise** at $15.00 / 1,000 elements ($0.015/element). A 20-candidate evaluation costs ~$0.90 USD/search.
    - Quota: 3,000 QPM default. Exponential backoff with jitter on HTTP 429/503.
4.  **[Resolved Phase 0 - 2026-10-23]** Are nearby-place categories and returned fields sufficient to identify fuel stations, cafés and parking?
    - *Yes.* Places API (New) `places:searchNearby` supports `includedTypes: ["gas_station", "cafe", "coffee_shop", "parking"]`. To minimize costs (~$32/1,000 requests), strict field masks (`places.displayName`, `places.primaryType`, `places.location`) must be used, and calls must be limited to top-ranked candidates only.
5.  **[Resolved Phase 0 - 2026-10-23]** Can provider results be cached or stored, and under what restrictions?
    - Place IDs may be stored indefinitely.
    - Latitude/longitude coordinates can only be cached temporarily for up to 30 consecutive calendar days.
    - Google route geometry and places cannot be displayed on a non-Google basemap.
6.  What sampling interval produces good candidates without excessive
    geometry computation?
7.  What scoring weights work best on a curated real-route dataset?
8.  Should a future release support shared ride links, and what
    expiry/access controls should they have?
9.  What is the deployment target and expected request volume?

## Assumptions that must not silently become facts

-   A route geometry intersection does not prove a usable meeting point.
-   A place near a route is not necessarily accessible from the road.
-   A listed fuel station or cafe is not guaranteed to be open or safe
    for stopping.
-   Provider duration estimates may vary with traffic and routing
    snapshots.
-   Initial scoring weights are hypotheses and must be validated.
