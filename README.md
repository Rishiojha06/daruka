# 🏍️ Daruka — Motorcycle Meeting-Point Finder

> Named after **Daruka (दारुक)**, Lord Krishna's legendary charioteer and master navigator in the Mahabharata, who steered chariots across complex terrains with unmatched speed, precision, and route mastery.

Daruka is a full-stack, route-aware meeting-point finder for two motorcyclists planning a ride to a shared destination. Instead of naive geographic midpoints that lead into lakes or dead ends, Daruka evaluates real road geometries, travel times, and traffic conditions to recommend practical, fair meeting spots with balanced arrival times and limited detours.

---

## 🌟 Key Features

- **Two-Wheeler Road Network Routing**: Computes motorcycle-specific routes and high-resolution polylines via Google Routes API.
- **Route-Snapped Candidate Engine**: Samples road geometries, detects convergence zones, and generates stopping candidates verified to sit on accessible roads.
- **Arrival-Balance Scoring Algorithm**: Minimizes arrival time difference ($|t_A - t_B|$) while enforcing strict per-rider detour thresholds:
  $$\text{Detour}_A = \max\bigl(0, (t_A + t_{M \to D}) - t_{\text{directA}}\bigr)$$
- **Interactive Google Maps UI**: Custom colored pins for Rider A, Rider B, Destination, and ranked meeting points, with auto-fit camera framing.
- **Enterprise Places Autocomplete Proxy**: Server-side Google Places API (New) proxy with automatic session tokens and offline fallback to 32+ Bengaluru biker landmarks.
- **Turn-by-Turn Navigation Handoff**: Deep links directly to Google Maps navigation with `travelmode=two_wheeler`.

---

## 🏗️ Architecture

```text
daruka/
  apps/
    api/              # NestJS + TypeScript REST API
      src/algorithm/  # Route sampling, candidate engine, scoring models
      src/routing/    # Provider adapter (Google Routes API + Mock Provider)
      src/places/     # Autocomplete & place details proxy
      src/meeting-points/ # Search orchestration
    web/              # React 18 + Vite + TypeScript Frontend
      src/components/ # LocationForm, LocationInput, MapView, RecommendationCards
      src/services/   # Autocomplete service, Google Maps JS loader, REST client
  packages/
    shared-types/     # Shared TypeScript domain contracts & DTOs
  docs/               # PRD, TDD, API Contract, Test Plan, Decisions
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x

### Installation
```bash
# Clone the repository
git clone https://github.com/Rishiojha06/daruka.git
cd daruka

# Install dependencies
pnpm install
```

### Environment Configuration
1. **API Environment (`apps/api/.env`)**:
   ```env
   PORT=4000
   NODE_ENV=development
   API_PREFIX=/api/v1
   CORS_ORIGIN=http://localhost:5173
   ROUTING_PROVIDER_MODE=mock  # Set to 'live' for real Google Maps APIs
   GOOGLE_MAPS_API_KEY=your_server_api_key_here
   ```

2. **Web Environment (`apps/web/.env`)**:
   ```env
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   VITE_GOOGLE_MAPS_API_KEY=your_browser_api_key_here
   ```

### Running Locally
```bash
# Terminal 1: Start backend API (http://localhost:4000)
pnpm run dev:api

# Terminal 2: Start frontend web app (http://localhost:5173)
pnpm run dev:web
```

---

## 🧪 Testing & Quality Gates

```bash
# Run all unit and integration tests (67 tests across workspaces)
pnpm run test

# Run API end-to-end tests (5 scenarios)
pnpm --filter @weekend-ride/api run test:e2e

# Run strict TypeScript typechecking
pnpm run typecheck

# Run ESLint across all packages
pnpm run lint

# Production builds
pnpm run build
```

---

## 🛡️ Security & Privacy

- **Server-side Isolation**: Secret routing and matrix keys never reach the client bundle.
- **Client Key Restrictions**: Browser keys only require the *Maps JavaScript API* and should be restricted by HTTP referrer (`localhost` / domain).
- **Privacy First**: Logs do not store exact rider coordinates or personal information.

---

## 📄 License
MIT
