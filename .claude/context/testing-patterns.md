# Testing Patterns Context

## Tooling
- API tests: Vitest.
- Fixtures: Prisma Fabbrica.

## Structure
- Tests live in `apps/api/src/features/<feature>/.test`.
- Handler tests use the `hono/testing` client.

## Required Pattern (Handlers)
- Group cases by HTTP status.
- Each case should define `setup`, `execute`, and `assert` to keep tests isolated.

## TDD Cycle
- Red → Green → Refactor.
- Keep tests deterministic and fast; avoid time‑dependent flakiness.
- Prefer behavior assertions over implementation details.

## Coverage
- Target 80%+ for lines/branches/functions/statements.
- Run `bun run test:coverage` after adding tests.
