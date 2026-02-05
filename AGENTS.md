# Repository Guidelines

## Project Structure & Module Organization
This is a Bun-based monorepo for a Bedrock-powered chat assistant with Lambda backends and a React frontend.

Key paths:
- `app/api/` Lambda functions (SSE handler + action router).
- `app/ui/` React + Vite frontend (`app/ui/strands-agents`).
- `app/iac/` Terraform modules and environments.
- `packages/` Shared workspace packages (e.g., `logger`, `sse-utils`).
- `docs/` Architecture and operational notes.

## Build, Test, and Development Commands
Run commands from the repo root unless noted.

- `bun install` install dependencies.
- `bun run dev` run all app dev servers (workspace-filtered).
- `bun run build` build all `@app/*` workspaces.
- `bun run check` spell check + type check + biome lint.
- `bun run format` format with Biome.
- `bun run test:run` run all workspace tests.
- `cd app/api/strands-agents-handler && bun run build` build handler Lambda.
- `cd app/api/strands-agents-actions && bun run build` build actions Lambda.
- `cd app/ui/strands-agents && bun run dev` run the UI locally.

## Coding Style & Naming Conventions
- Indentation: spaces (configured in `biome.jsonc`).
- Formatting/Linting: Biome (`bun run format`, `bun run check`).
- Spelling: `cspell` via `bun run check:spell`.
- TypeScript: prefer `unknown` over `any`, validate inputs with Zod, use early returns.
- Dates: use `dayjs` (not `Date`) as noted in `.claude/rules/`.
- Naming: keep files and exports descriptive; tests use `*.test.ts` when added.

## Testing Guidelines
Tests run with Bun’s built-in test runner via `bun run test:run`.
No first-party test files are currently present; when adding tests, place them next to source files using `*.test.ts` and run `bun test path/to/file.test.ts` for a single file.

## Commit & Pull Request Guidelines
Commit history mixes Conventional Commits (`feat:`, `fix:`, `docs:`) with short imperative messages. Prefer Conventional Commits for new work and keep messages under ~72 characters.

PRs should include:
- A clear summary and rationale.
- Links to relevant issues or tickets.
- Screenshots or recordings for UI changes (`app/ui/`).
- Notes on infra changes for `app/iac/` updates.

## Configuration & Secrets
Local config typically lives in `.env` (see `.env.example` under `app/ui/strands-agents`).
Secrets for AWS/Slack are expected in Parameter Store during deploy; avoid committing secrets.
