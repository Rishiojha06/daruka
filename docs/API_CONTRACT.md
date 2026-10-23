# API Contract --- MVP

## `POST /api/v1/meeting-points/search`

This contract is provider-neutral. Implementation may refine optional
fields, but must keep semantics stable and document any breaking
changes.

## Request

``` json
{
  "riders": [
    { "id": "rider-a", "location": { "lat": 12.9698, "lng": 77.7500 } },
    { "id": "rider-b", "location": { "lat": 12.8416, "lng": 77.6760 } }
  ],
  "destination": { "lat": 13.3702, "lng": 77.6835 },
  "preferences": {
    "priority": "balanced_arrival",
    "maxDetourMinutes": 15,
    "limit": 3
  }
}
```

Coordinates above are examples only.

### Validation

-   Exactly two riders.
-   IDs must be non-empty and distinct.
-   Coordinates must be finite numbers within geographic bounds.
-   `priority` for MVP must be `balanced_arrival`.
-   `maxDetourMinutes` defaults to 15 and must be within a documented
    range (recommended 0--60).
-   `limit` defaults to 3 and must be 1--3.
-   Reject unexpected oversized payloads.

## Successful response

``` json
{
  "status": "ok",
  "generatedAt": "2026-10-23T01:00:00.000Z",
  "routes": {
    "riderA": {
      "distanceMeters": 12000,
      "durationSeconds": 2400,
      "geometry": []
    },
    "riderB": {
      "distanceMeters": 9000,
      "durationSeconds": 2100,
      "geometry": []
    }
  },
  "recommendations": [
    {
      "id": "candidate-1",
      "name": "Example Fuel Station",
      "category": "fuel_station",
      "location": { "lat": 13.05, "lng": 77.65 },
      "travel": {
        "riderASeconds": 2040,
        "riderBSeconds": 2160,
        "arrivalDifferenceSeconds": 120,
        "toDestinationSeconds": 1800
      },
      "detour": {
        "riderASeconds": 300,
        "riderBSeconds": 240
      },
      "score": 12.0,
      "navigationUrl": "https://www.google.com/maps/dir/?api=1&destination=13.05,77.65"
    }
  ],
  "warnings": []
}
```

All values in this example are illustrative. `geometry` should use the
implementation's documented transport format; do not return an empty
geometry as if a real route were available. For production responses,
omit unavailable optional fields rather than fabricating them. Score is
a relative internal ranking value, not a user-facing quality percentage.

## No-candidate response

Return HTTP 200 with `status: "no_candidates"` when the request was
valid and processed successfully but no candidate satisfies the
constraints.

``` json
{
  "status": "no_candidates",
  "generatedAt": "2026-10-23T01:00:00.000Z",
  "routes": {},
  "recommendations": [],
  "warnings": [
    {
      "code": "NO_VALID_MEETING_POINT",
      "message": "No meeting point met the current route and detour constraints. Try increasing the detour limit or selecting different locations."
    }
  ]
}
```

Include routes when available. Do not use an empty object if valid route
summaries are available.

## Error response

Use stable error codes and avoid raw provider messages.

``` json
{
  "status": "error",
  "error": {
    "code": "ROUTE_PROVIDER_UNAVAILABLE",
    "message": "Route information is temporarily unavailable. Please try again."
  },
  "requestId": "opaque-request-id"
}
```

Suggested codes: - `INVALID_REQUEST` - `ROUTE_PROVIDER_UNAVAILABLE` -
`ROUTE_NOT_FOUND` - `PLACE_SEARCH_UNAVAILABLE` -
`NO_VALID_MEETING_POINT` - `RATE_LIMITED` - `REQUEST_TIMEOUT` -
`INTERNAL_ERROR`

Use appropriate HTTP statuses: 400 for invalid input, 429 for rate
limit, 502/503 for provider failures, 504 for timeouts, and 500 for
unexpected internal errors. `no_candidates` is a successful computation
outcome, not a server error.

## Contract rules

-   Do not return API keys or provider raw payloads.
-   Use seconds and metres consistently in the API.
-   Use ISO 8601 UTC timestamps.
-   Frontend converts to display units.
-   Do not present illustrative values in the real app.
-   Add OpenAPI/Swagger docs from NestJS and keep them in sync with
    DTOs.
