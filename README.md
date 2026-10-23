# Weekend Ride — Motorcycle Meeting-Point Finder

A route-aware meeting-point finder for two motorcycle riders planning a shared ride to a common destination. Optimizes for balanced arrival times, limits detours, and recommends practical stopping places in Bengaluru, India.

## Repository Structure

```text
weekend-ride/
  apps/
    api/        # NestJS REST API (Route calculations, candidate generation, scoring)
    web/        # React + Vite + TypeScript frontend
  docs/         # Architecture & product specifications
  .env.example  # Environment variable template
```

## Quick Start

### Prerequisites
- Node.js >= 20
- pnpm >= 9

### Installation
```bash
pnpm install
```

### Environment Setup
```bash
cp .env.example .env
```

### Running Locally
```bash
# Start backend API (http://localhost:4000)
pnpm run dev:api

# Start frontend web app (http://localhost:5173)
pnpm run dev:web
```

### Quality Checks
```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
