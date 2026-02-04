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

# Run single test file
bun test app/api/strands-agents-actions/src/actions/calculator.test.ts

# Format code
bun run format

# Build Strands Agents Lambda functions
cd app/api/strands-agents-handler && bun run build
cd app/api/strands-agents-actions && bun run build

# Start frontend dev server
cd app/ui/strands-agents && bun run dev

# Deploy Lambda functions (after build)
cd app/api/strands-agents-handler/dist && zip -r ../handler.zip . && \
  aws lambda update-function-code --function-name strands-agents-dev-handler --zip-file fileb://../handler.zip
```

## Architecture Overview

Bun-based monorepo for a streaming chat assistant using AWS Bedrock Agents with Server-Sent Events (SSE).

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│  React + Vite   │     │  API Gateway    │     │     Bedrock Agent       │
│  SPA Frontend   │────▶│  HTTP API v2    │────▶│    (Amazon Nova Micro)  │
│                 │◀────│  (SSE Stream)   │◀────│                         │
└─────────────────┘     └─────────────────┘     └───────────┬─────────────┘
                                                            │
                                                            ▼
                                               ┌─────────────────────────┐
                                               │    Lambda Actions       │
                                               │    (Multi-tool Router)  │
                                               │                         │
                                               │  ┌─────┐ ┌────┐ ┌────┐  │
                                               │  │Calc │ │Time│ │Web │  │
                                               │  └─────┘ └────┘ └────┘  │
                                               └─────────────────────────┘
```

### Directory Structure

- **`packages/`** - Shared libraries (workspace packages)
  - `logger/` - Pino logger with AsyncLocalStorage for request ID tracking
  - `sse-utils/` - SSE formatting utilities for streaming responses
- **`app/api/`** - Lambda functions
  - `strands-agents-handler/` - SSE streaming handler, invokes Bedrock Agent
  - `strands-agents-actions/` - Multi-tool router (Calculator, DateTime, WebSearch)
- **`app/ui/`** - Frontend applications
  - `strands-agents/` - React + Vite SPA chat interface
- **`app/iac/`** - Terraform infrastructure
  - `modules/strands-agents/` - API Gateway, Lambda, Bedrock Agent, IAM
  - `environments/strands-agents/` - Environment configuration

### Request Flow

1. **User Input** → Browser sends POST `/chat` with message
2. **API Gateway** → HTTP API v2 routes to Handler Lambda
3. **Handler Lambda** → Invokes Bedrock Agent with sessionId
4. **Bedrock Agent** → Claude Haiku processes request, calls action groups as needed
5. **Actions Lambda** → Executes tools (calculator, datetime, websearch)
6. **SSE Response** → Handler streams chunks back through API Gateway to browser

### Key Design Decisions

- **API Gateway HTTP API v2** - Required for SSE streaming (not Lambda Function URL)
- **SSE over WebSocket** - Simpler implementation for one-way streaming
- **Parameter Store** - Cost-effective secrets management (free tier)
- **ARM64 Lambda** - 20% cost reduction
- **Amazon Nova Micro** - Most cost-effective model ($0.035/1M input tokens)
- **React + Vite SPA** - Fast development and production builds

## Code Conventions

### Logger Usage

All Lambda functions use a shared logger with request ID tracking via AsyncLocalStorage:

```typescript
import { logger, runWithRequestId } from "@packages/logger";

export const handler = async (event) => {
  const requestId = event.requestContext?.requestId || randomUUID();

  return runWithRequestId(requestId, async () => {
    logger.info({ event: "action_name", data }, "message");
    // ... handler logic
  });
};
```

### SSE Utilities

Use the `@packages/sse-utils` package for formatting SSE events:

```typescript
import { formatSSE, SSEEventType } from "@packages/sse-utils";

// Send a chunk
responseStream.write(formatSSE({
  event: SSEEventType.CHUNK,
  data: { text: "Hello", chunkIndex: 0 },
}));

// Send completion
responseStream.write(formatSSE({
  event: SSEEventType.COMPLETE,
  data: { sessionId, totalChunks },
}));
```

### Workspace Package Management

Bun workspace monorepo with shared packages referenced using `workspace:*`:

```json
{
  "dependencies": {
    "@packages/logger": "workspace:*",
    "@packages/sse-utils": "workspace:*"
  }
}
```

Packages export TypeScript source directly (no build step needed) via the `exports` field.

### Lambda Build Process

Lambda functions use Bun's bundler:
- **Format**: ESM (`--format=esm`)
- **Target**: Node.js (`--target=node`)
- **External**: `@aws-sdk/*` packages (provided by Lambda runtime)
- **Output**: `dist/index.js` + `dist/package.json` (with `"type": "module"`)

```bash
bun build src/index.ts --outdir=dist --target=node --format=esm --external '@aws-sdk/*' && echo '{"type":"module"}' > dist/package.json
```

The `package.json` with `"type": "module"` is required for Lambda Node.js runtime to recognize ESM format.

## Infrastructure

### Deploy via Terraform

```bash
# Build Lambda functions first
cd app/api/strands-agents-handler && bun run build
cd ../strands-agents-actions && bun run build

# Deploy infrastructure
cd app/iac/environments/strands-agents
terraform init
terraform apply
```

### Outputs

```bash
terraform output api_endpoint           # API Gateway URL
terraform output bedrock_agent_id       # Agent ID
terraform output bedrock_agent_alias_id # Alias ID
```

### Environment Variables (Lambda)

- `BEDROCK_AGENT_ID` - Bedrock Agent ID
- `BEDROCK_AGENT_ALIAS_ID` - Bedrock Agent Alias ID
- `LOG_LEVEL` - Log level (debug/info)

## Bedrock Agent Action Groups

The `strands-agents-actions` Lambda implements three action groups:

### Calculator
- **Path:** `/calculate` (POST)
- **Input:** `{ "expression": "sqrt(144)" }`
- **Uses:** mathjs for safe expression evaluation

### DateTime
- **Paths:**
  - `/current-time` (GET) - Current time in specified timezone
  - `/convert-timezone` (GET) - Convert between timezones
- **Parameters:** `timezone`, `datetime`, `fromTimezone`, `toTimezone`

### WebSearch
- **Path:** `/search` (GET)
- **Parameters:** `query`, `maxResults`
- **Requires:** Tavily API key in Parameter Store (`/strands-agents/websearch-api-key`)

## Frontend Development

### Start Development Server

```bash
cd app/ui/strands-agents
bun install
bun run dev
```

### Environment Variables

Create `.env` from `.env.example`:
```bash
VITE_API_ENDPOINT=https://xxxxxx.execute-api.ap-northeast-1.amazonaws.com
```

### Build for Production

```bash
bun run build
```

Output is in `dist/` directory, ready for static hosting (Vercel, Netlify, S3, etc.).

## Cost Estimation

Monthly cost for 1000 messages/day (~$12/month):
- API Gateway HTTP API: ~$1
- Lambda Handler (512MB × 10s): ~$5
- Lambda Actions (256MB × 2s): ~$2
- Bedrock Amazon Nova Micro: ~$2
- CloudWatch Logs: ~$2

Budget alert configured at $20/month (80% threshold).

## AWS Investigation

When debugging Lambda errors or API issues, use the AWS investigation commands:

```bash
# View recent Lambda logs
aws logs filter-log-events \
  --log-group-name "/aws/lambda/strands-agents-dev-handler" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern "ERROR" \
  --region ap-northeast-1

# Real-time log monitoring
aws logs tail "/aws/lambda/strands-agents-dev-handler" --follow --region ap-northeast-1
```

Investigation reports are output to `docs/aws/investigate/{YYYYMMDD}_{HHMM}_{title}.md`.

See `.claude/rules/aws-investigation.md` for detailed investigation procedures.

## Key Code Conventions

- Use `dayjs` for all date/time handling (not native Date)
- Use `unknown` over `any`, handle undefined explicitly
- Use Zod for input validation at boundaries
- Prefer early returns to reduce nesting
- Run `bun run check` before committing

See `.claude/rules/` for detailed coding standards, testing patterns, and security guidelines.
