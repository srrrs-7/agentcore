# Environment Context

## Local Files
- API env: `apps/api/.env`
- Web env: `apps/web/.env`

## API Environment Variables
- `DATABASE_URL` (preferred), or individual DB vars:
  - `DB_HOST`, `DB_PORT`, `DB_DBNAME`, `DB_USERNAME`, `DB_PASSWORD`
- `PORT` (defaults to 8080)
- `NODE_ENV` (`development`, `test`, `production`)
- `LOG_LEVEL` (Pino)
- `TZ` (recommended)

## Auth (Cognito)
- If these are set, bearer auth is enforced:
  - `COGNITO_ISSUER`
  - `COGNITO_CLIENT_ID`
  - `COGNITO_JWKS_URI`
- If missing, auth is skipped for `/api/*` routes (dev mode behavior).

## Web Environment Variables
- `VITE_API_URL` (defaults to http://localhost:8080)
- `VITE_AUTH_TOKEN` (dev‑only token; do not use in production)
- `VITE_TIMEZONE`

## Guidance
- Never commit secrets.
- Document new required env vars here and in root README if user‑facing.
