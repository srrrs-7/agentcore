# API Contracts Context

## Base
- All API endpoints are under `/api/*`.
- Auth: `/api/*` routes are protected by bearer auth middleware.
  - If Cognito env vars are missing, auth is skipped in dev.
- Errors are mapped to HTTP status codes via domain error types.

## Health
- `GET /health` → `{ status: "ok" }`.

## Tasks
- `GET /api/tasks` → `{ tasks: Task[] }`.
- `GET /api/tasks/:id` → `{ task: Task }`.
- `POST /api/tasks` → `{ task: Task }`.
- `PUT /api/tasks/:id` → `{ task: Task }`.
- `DELETE /api/tasks/:id` → `204 No Content`.

## Stamps
- `GET /api/stamps/status` → `{ status, stamp }` (current work status).
- `POST /api/stamps` → `{ stamp }`.
  - Body: `{ action: "clock_in" | "clock_out" | "break_start" | "break_end" }`.

## Attendance
- `GET /api/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD` → `{ records, summary }`.
- `GET /api/attendance/:date` → `{ record }`.

## Files
- `POST /api/files/presign` → `{ file, uploadUrl, expiresIn }`.
- `GET /api/files` → `{ files }`.
- `GET /api/files/:id` → `{ file }`.
- `PUT /api/files/:id/complete` → `{ file }`.

## Validation & Errors
- Zod validation at the handler layer; invalid input returns 400 with issues.
- Common error mappings:
  - `VALIDATION_ERROR` → 400
  - `NOT_FOUND` / `FILE_NOT_FOUND` → 404
  - `DATABASE_ERROR` → 500
