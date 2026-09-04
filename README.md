# rcabe

A tiny full-stack task board used to exercise the Cloud Agent development
environment end to end.

- **`server/`** — Express + TypeScript REST API with an in-memory task store.
- **`web/`** — React + Vite + TypeScript single-page task board.

The repository is an npm workspaces monorepo, so a single `npm install` at the
root installs both packages.

## Prerequisites

- Node.js >= 20 (developed against Node 22)
- npm 10+

## Getting started

```bash
npm install        # install all workspaces
npm run dev        # start the API (:3001) and web app (:5173) together
```

Then open http://localhost:5173. The Vite dev server proxies `/api/*` to the
API on port 3001, so no extra configuration is needed.

## Common commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the API and web dev servers concurrently |
| `npm run dev:server` | Run only the API (`http://localhost:3001`) |
| `npm run dev:web` | Run only the web app (`http://localhost:5173`) |
| `npm run build` | Type-check and build both workspaces |
| `npm run typecheck` | Type-check both workspaces without emitting |
| `npm run lint` | Lint the whole repository with ESLint |
| `npm test` | Run the server test suite (Vitest) |

## API

Base URL: `http://localhost:3001`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/tasks` | List tasks (newest first) |
| `POST` | `/api/tasks` | Create a task `{ "title", "status?" }` |
| `PATCH` | `/api/tasks/:id` | Update a task's `title` and/or `status` |
| `DELETE` | `/api/tasks/:id` | Delete a task |

A task's `status` is one of `todo`, `in_progress`, or `done`.

## Cloud Agent environment

`.cursor/environment.json` configures the Cloud Agent environment:

- `install`: `npm install` (installs both workspaces)
- `terminals`: run the API and web dev servers
- `ports`: expose `3001` (API) and `5173` (web)
