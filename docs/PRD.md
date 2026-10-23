# Product Requirements Document (PRD)

## Weekend Ride --- Meeting-Point Finder

-   Status: MVP specification
-   Product type: responsive web application
-   Primary users: two people planning a shared motorcycle ride
-   Initial market: Bengaluru, India; architecture should not hard-code
    the city
-   Primary outcome: reduce the manual work of finding a fair, practical
    place to meet before riding to a shared destination

## 1. Problem statement

Two riders live in different areas. When they agree on a destination,
they manually compare routes on one or more phones to decide where to
meet. This is inconvenient, especially when only one phone is available,
and a geographic midpoint often does not correspond to a useful road or
stopping place.

## 2. Product vision

Given Rider A's starting location, Rider B's starting location and a
shared destination, recommend one best meeting point plus up to two
alternatives. The primary optimization goal is to balance both riders'
estimated travel times to the meeting point. The system must also
control detours and prioritize reachable, practical stopping places.

## 3. Goals

1.  A user can enter/select two starting locations and a shared
    destination from one device.
2.  The app displays both riders' routes to the destination on one map.
3.  The app proposes up to three meeting-point candidates using
    road-network and travel-time data.
4.  The primary recommendation balances arrival times, subject to
    acceptable detour and reachability constraints.
5.  The app explains why a candidate ranks well: rider travel times,
    arrival-time difference, detour estimates and onward journey.
6.  The user can open navigation to the selected meeting point in an
    external maps app.
7.  The app works on mobile screens and desktop browsers.
8.  API keys and provider credentials are not exposed in server-side
    secrets or source control.

## 4. Non-goals for MVP

-   User accounts or authentication.
-   Persistent ride history or database.
-   Live location sharing or continuous tracking.
-   In-app turn-by-turn navigation.
-   Social features, chat, invitations, rider profiles or group rides.
-   Guaranteed real-time traffic accuracy.
-   A claim that a stop is safe, open or accessible unless that is
    supported by provider data and validated.
-   Multi-provider routing fallback at runtime.
-   Native iOS/Android apps.

## 5. Personas and core journey

### Persona A: ride organizer

Wants to enter both starting locations and the destination quickly, see
one shared map, and send a meeting-point link or navigation destination
to the friend.

### Core journey

1.  Open the app.
2.  Enter Rider A's starting point.
3.  Enter Rider B's starting point.
4.  Enter the shared destination.
5.  Press **Find meeting point**.
6.  Review route map and ranked candidates.
7.  Select a candidate and open external navigation.

For MVP, the user can enter both locations on one device. GPS location
is optional, with manual search/map selection always available.

## 6. Functional requirements

### FR-01: Location entry

-   Provide three distinct location inputs: Rider A start, Rider B
    start, shared destination.
-   Support provider-backed place/address autocomplete where available.
-   Allow map pin selection as a fallback.
-   Allow browser geolocation only after explicit user action and
    permission.
-   Show selected place label and coordinates internally.
-   Do not require the two riders to use separate devices.

### FR-02: Input validation

-   All three locations are required.
-   Latitude must be between -90 and 90; longitude between -180 and 180.
-   Reject invalid or missing coordinates before provider calls.
-   Prevent accidental duplicate/empty selections where the user has not
    confirmed a location.
-   Display useful validation messages without exposing provider
    internals.

### FR-03: Route preview

-   Request road routes from each rider's start to the shared
    destination.
-   Display both routes distinctly on the same map, with separate start
    markers and a destination marker.
-   Display estimated travel time and distance when available.
-   Clearly label estimates and indicate if traffic-aware routing is
    unavailable.
-   Do not imply the riders will follow identical routes before meeting.

### FR-04: Candidate generation

-   Generate candidate points from route geometry and/or nearby
    road-accessible locations.
-   Prefer points near route sections that converge or share a practical
    onward route.
-   Candidate generation must not assume that routes intersect simply
    because they are geographically close.
-   Deduplicate nearby candidates and limit the candidate count sent to
    travel-time APIs.
-   A candidate must be reachable by road from both starting points.
-   A candidate must support a practical onward route to the shared
    destination.
-   If route geometry is insufficient or the provider returns no usable
    candidates, return a clear failure state instead of fabricating a
    result.

### FR-05: Recommendation ranking

-   Primary objective: minimize the absolute difference between
    estimated rider arrival times.
-   Secondary objectives: avoid excessive total travel time and
    unnecessary detours.
-   Apply a configurable maximum-detour constraint; default MVP value is
    15 minutes per rider, configurable server-side.
-   Reject candidates with missing/invalid route duration, inaccessible
    road approaches or unusable onward routing.
-   Return at most three ranked candidates.
-   The scoring formula and weights must be documented and unit-tested.
-   Never label a result "best" if candidate evaluation was incomplete;
    expose a warning or partial-results status.

### FR-06: Practical stopping places

-   Where provider data is available, associate candidates with nearby
    fuel stations, cafes or parking areas.
-   A place's proximity in straight-line distance is not sufficient
    proof of road access.
-   Display place category and provider-supplied details only when
    available.
-   If no suitable named place is found, the app may show a
    road-accessible coordinate as a fallback, but must label it clearly
    and avoid safety guarantees.

### FR-07: Results

For each recommendation, show: - Place name or coordinate label. - Place
category when available. - Rider A travel duration and distance. - Rider
B travel duration and distance. - Arrival-time difference. - Detour time
for each rider versus their direct route to the destination. - Estimated
onward travel from meeting point to destination, when available. - Map
marker and candidate route context. - Navigation action.

### FR-08: Navigation handoff

-   Create a directions URL to the selected meeting point using the
    chosen maps provider's documented URL format.
-   Open it in a new tab/window or allow the operating system to hand it
    to the maps app.
-   Do not promise that the destination will open in a specific
    installed app.

### FR-09: Loading, errors and empty states

-   Show loading feedback while routes/candidates are calculated.
-   Prevent accidental duplicate submissions while a request is pending.
-   Handle denied geolocation permission, provider quota errors,
    timeouts, invalid input, no candidates, partial route results and
    network errors.
-   Preserve entered locations when a request fails.
-   Provide a retry action where appropriate.
-   Never show invented routes or results as a fallback.

### FR-10: Privacy

-   No user account or database is required for MVP.
-   Do not persist exact locations by default.
-   Avoid logging raw coordinates or full provider responses in
    production logs.
-   Use HTTPS in deployed environments.
-   Geolocation is opt-in and must be initiated by the user.
-   Document third-party maps provider data handling and privacy
    requirements.

## 7. UX requirements

-   Mobile-first, usable with one hand where practical.
-   Main form should fit on a typical mobile viewport with sensible
    scrolling.
-   Inputs must have accessible labels and keyboard navigation.
-   Map markers and route lines must not rely on color alone; provide
    labels or a legend.
-   Result cards must remain usable on small screens.
-   Display times in minutes and distances using appropriate local
    units.
-   Show an explicit disclaimer: estimates can change with traffic,
    route availability and provider data.
-   Provide clear empty/error states.

## 8. Success metrics

Measure during test rides rather than assuming the algorithm is
correct: - Successful calculation rate. - Median API response time. -
Median difference between rider arrival estimates for selected
candidates. - Median added detour for each rider. - Percentage of
results with a valid, identifiable stopping place. - User selection rate
for the first recommendation versus alternatives. - API cost per
successful search.

Initial engineering targets (validate, do not treat as guaranteed): -
Backend response p95 under 8 seconds for a normal search, excluding
exceptional provider latency. - No more than 20 candidates sent for
matrix evaluation per request. - Return up to 3 valid recommendations. -
All ranking decisions reproducible from captured, sanitized test
fixtures.

## 9. Acceptance criteria

1.  Given three valid locations, the app can request both routes and
    display them together.
2.  Given valid candidate travel times, the algorithm ranks candidates
    by the configured scoring policy.
3.  A candidate with a much worse arrival-time difference should lose to
    a comparable candidate with a better balance, unless the latter
    violates a detour or reachability constraint.
4.  Candidates exceeding the configured detour limit are excluded by
    default.
5.  If the provider returns no usable candidates, the UI displays a
    no-result state and does not invent a location.
6.  If one route fails, the UI explains that the recommendation could
    not be completed and preserves inputs.
7.  Provider errors do not expose secrets, raw stack traces or internal
    credentials.
8.  No API key intended to be secret appears in the client bundle.
9.  The user can open directions to a selected candidate.
10. Unit, integration and end-to-end tests cover the primary journey and
    critical failure states.

## 10. Assumptions and risks

-   A suitable maps provider supports road routing, candidate
    travel-time evaluation, place discovery and a motorcycle/two-wheeler
    mode appropriate for the target region. This must be verified before
    committing.
-   Provider APIs may differ in route modes, traffic data, matrix
    limits, pricing, caching rights and terms.
-   Route geometry proximity is only a candidate-generation signal, not
    proof of a good meeting point.
-   Place listings do not prove a safe entrance, parking access or
    current opening status.
-   Travel-time estimates are estimates, not guarantees.
-   The MVP is for two riders only.
