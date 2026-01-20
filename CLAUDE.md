# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
bun install

# Run all workspace tests
bun run test:run

# Type checking across all workspaces
bun run check:type

# Full check (spell check + type check + biome lint)
bun run check

# Format code
bun run format

# Lint and auto-fix with Biome
bun run check:biome

# Spell check
bun run check:spell

# Run tests in a specific package (uses workspace filtering)
bun run --filter @packages/logger test

# Type check in specific package (uses tsgo)
cd packages/logger && bun run check:type
```

## Architecture Overview

This is a Bun-based monorepo (`play-agentcore`) structured as:

- **`packages/`** - Shared libraries consumed across apps
  - `logger/` - Pino-based logger with AsyncLocalStorage for request ID tracking
- **`app/`** - Application deployments (not workspace packages)
  - `ui/line/`, `ui/slack/` - Frontend UI applications
  - `func/` - Serverless functions
  - `iac/` - Terraform infrastructure code (environments/dev, modules/)

### Workspace Configuration

- Package manager: **Bun 1.3.5** (specified in `packageManager` field)
- Workspaces: `apps/*` and `packages/*`
- TypeScript packages use source directly (no build step) via `exports` field pointing to `.ts` files

### Key Tools

- **Biome** - Linting and formatting (space indentation, tailwind directives support)
- **cspell** - Spell checking
- **Husky** - Pre-commit hooks run `bun check` and `bun test:run`
- **tsgo** - Native TypeScript type checking (`@typescript/native-preview`)

## Code Conventions

### Logger Usage

The shared logger package uses `AsyncLocalStorage` to automatically attach request IDs:

```typescript
import { logger, runWithRequestId } from "@packages/logger";

await runWithRequestId(requestId, async () => {
  logger.info({ data }, "message"); // requestId auto-attached
});
```

### Database (Prisma)

When database packages are added (per the database skill):
- Schema location: `packages/db/prisma/schema.prisma`
- Use snake_case for columns with `@map` directives
- Use camelCase for Prisma field names
- Always include `createdAt` and `updatedAt` fields
- Commands: `bun run db:generate`, `bun run db:migrate:dev`, `bun run db:migrate:deploy`

### Biome Rules

- `noFloatingPromises: error` - All promises must be awaited or explicitly handled
- Space indentation (better for code generation)
- Tailwind CSS directives supported

## Git Worktree Workflow

For parallel development using worktrees:

```bash
make wt              # Create worktree from origin/main at ../wt_1
make wt-d            # Remove worktree
make wt-l            # List worktrees and branches
```
