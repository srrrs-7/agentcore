# Observability Context

## Logging
- Logger: Pino (`apps/api/src/lib/logger`).
- Log level from `LOG_LEVEL` or defaults by environment.
- Development uses `pino-pretty` for human‑readable output.
- Sensitive fields are redacted (passwords, tokens, authorization headers, etc.).

## Error Handling
- Global error handler logs unexpected errors and returns 500 JSON.
- Handlers map domain errors to HTTP status codes.

## Recommendations
- Avoid logging PII or secrets.
- Include request identifiers in logs when adding new request logging.
