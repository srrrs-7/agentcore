# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
bun install

# Full check (spell check + type check + biome lint)
bun run check

# Run all workspace tests
bun run test:run

# Format code
bun run format

# Build Lambda functions
cd app/func/vuln-scanner && bun run build
cd app/func/vuln-scanner-actions && bun run build
```

## Architecture Overview

Bun-based monorepo for a Slack-integrated vulnerability scanner using AWS Bedrock Agents.

```
┌─────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Slack  │─────▶│  Lambda          │─────▶│  Bedrock Agent  │
│  App    │◀─────│  (vuln-scanner)  │◀─────│  (Claude Haiku) │
└─────────┘      └──────────────────┘      └─────────────────┘
                                                    │
                                           ┌────────┴────────┐
                                           ▼                 ▼
                                    ┌────────────┐    ┌────────────┐
                                    │ NVD API    │    │ OSV API    │
                                    │ (CVE検索)  │    │ (Pkg検索)  │
                                    └────────────┘    └────────────┘
```

### Directory Structure

- **`packages/`** - Shared libraries (workspace packages)
  - `logger/` - Pino logger with AsyncLocalStorage for request ID tracking
- **`app/func/`** - Lambda functions
  - `vuln-scanner/` - Slack event handler, calls Bedrock Agent
  - `vuln-scanner-actions/` - Bedrock Agent action groups (NVD/OSV API calls)
- **`app/iac/`** - Terraform infrastructure
  - `modules/vuln-scanner/` - Lambda, Bedrock Agent, IAM, SSM
  - `environments/dev/` - Dev environment configuration

### Key Design Decisions

- **No API Gateway** - Lambda Function URL (free)
- **No Secrets Manager** - Parameter Store SecureString (free tier)
- **No NAT Gateway** - Public subnet, no VPC for Lambda
- **ARM64 runtime** - 20% cost reduction
- **Claude 3 Haiku** - Low cost model for Bedrock Agent

## Code Conventions

### Logger Usage

```typescript
import { logger, runWithRequestId } from "@packages/logger";

await runWithRequestId(requestId, async () => {
  logger.info({ event: "action_name", data }, "message");
});
```

### Biome Rules

- `noFloatingPromises: error` - Use `void` for intentional fire-and-forget
- Space indentation

### Lambda Build

Functions use esbuild bundling:
```bash
bun run build  # outputs to dist/index.mjs
```

## Infrastructure

### Deploy (via GitHub Actions)

Push to `main` triggers CI → Deploy to dev environment.

### Manual Terraform

```bash
cd app/iac/environments/dev
terraform init
terraform apply
```

### Required Secrets (Parameter Store)

- `/vuln-scanner/slack-signing-secret`
- `/vuln-scanner/slack-bot-token`
