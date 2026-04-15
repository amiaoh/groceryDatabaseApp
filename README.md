# Grocery Database App

A community-driven app for tracking and comparing grocery prices across stores.

## Features

- **Product search** — search for products and see the cheapest stores
- **Price observations** — log prices manually with store, brand, and special deal info
- **Store management** — browse, create, and edit store chains and locations
- **Auth** — Google sign-in via Better Auth

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React + Vite (TypeScript)               |
| Backend  | Hono on Node.js (TypeScript)            |
| Database | PostgreSQL via Neon (serverless driver) |
| ORM      | Drizzle ORM                             |
| Auth     | Better Auth                             |
| Monorepo | pnpm workspaces                         |

## Project Structure

```
packages/
  frontend/   # React + Vite app (port 5173)
  backend/    # Hono API server (port 3000)
  shared/     # Shared types
```

## Getting Started

### Prerequisites

- Node.js
- pnpm (`npm install -g pnpm`)

### Install dependencies

```bash
pnpm install
```

### Environment variables

Create `packages/backend/.env` with:

```
DATABASE_URL=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
```

### Run both frontend and backend

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

The frontend proxies `/api` requests to the backend during development.

### Database

```bash
pnpm --filter @grocery/backend db:generate   # generate migrations
pnpm --filter @grocery/backend db:migrate    # run migrations
pnpm --filter @grocery/backend db:studio     # open Drizzle Studio
```

## Login

Sign in with Google. For local testing without OAuth configured, a dummy account can be used — check with whoever set up the local DB.
