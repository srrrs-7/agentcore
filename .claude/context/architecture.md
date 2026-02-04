# Architecture Context

## Monorepo Layout
- `apps/api`: Hono + Prisma TypeScript backend.
- `apps/web`: Svelte 5 + Vite frontend.
- `apps/iac`: Terraform infrastructure and deploy scripts.
- Root tooling: Biome (`biome.jsonc`), CSpell (`cspell.config.yaml`), Bun workspace.

## Backend (apps/api)

### Entry Points
- `apps/api/src/index.ts` mounts routes, applies middleware, and exports the Hono app.
- Health check: `GET /health` returns `{ status: "ok" }`.

### Routing
- Routes are composed via `app.route("/api/<feature>", <featureRoutes>)`.
- Active routes:
  - `/api/tasks`
  - `/api/stamps`
  - `/api/attendance`
  - `/api/files`

### Layers (feature slice)
- `domain` → `service` → `repository` → `handler`.
- Handlers validate inputs (Zod), call services, map domain errors to HTTP responses.
- Repository layer uses Prisma and returns domain errors via shared helpers.

### Middleware
- `corsMiddleware` is applied globally.
- `bearerAuthMiddleware` is applied to all `/api/*` routes.
  - Auth is skipped in dev if Cognito env vars are missing.
- Error handling:
  - `.notFound()` returns 404 JSON.
  - `.onError()` logs with Pino and returns 500 JSON.

## Frontend (apps/web)

### Entry Points
- `apps/web/src/main.ts` mounts `App.svelte`.
- `App.svelte` implements client-side routing with `history.pushState` and `popstate`.

### Data & State
- Data fetching via `@tanstack/svelte-query` with shared client config.
- Shared utilities under `src/lib` (API client, query keys, i18n, utils).

### Feature Slice Layout
- Features live under `apps/web/src/features/<feature>`.
- Common UI under `apps/web/src/components` and `apps/web/src/components/ui`.
- Layouts under `apps/web/src/components/layouts`.

## Conventions
- Use `dayjs` for all date/time handling.
- Prefer feature‑scoped modules under `apps/api/src/features` and `apps/web/src/features`.
- Formatting/linting via Biome; type checks via workspace scripts.
