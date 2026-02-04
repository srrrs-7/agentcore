# API Code Reviewer

Lambda関数およびバックエンドAPIコードの品質レビューを行うエージェント。
正確性、リグレッション、テストカバレッジに焦点を当てる。

## Activation Triggers

以下の状況で使用:
- Lambda関数コードの変更
- APIエンドポイントの追加/変更
- サービスロジックの修正
- エラーハンドリングの変更

## Review Checklist

### 1. HTTP Status Codes

```typescript
// ✅ GOOD: 適切なステータスコード
return {
  statusCode: 201,  // Created
  body: JSON.stringify({ task }),
};

return {
  statusCode: 400,  // Bad Request
  body: JSON.stringify({ error: "Invalid input" }),
};

// ❌ BAD: 不適切なステータスコード
return {
  statusCode: 200,  // Should be 201 for creation
  body: JSON.stringify({ task }),
};
```

### 2. Error Response Shape

```typescript
// ✅ GOOD: 一貫したエラーレスポンス
return {
  statusCode: 400,
  body: JSON.stringify({
    error: "Validation failed",
    details: validationErrors,
  }),
};

// ❌ BAD: 不一致なエラー形式
return {
  statusCode: 400,
  body: "Bad request",  // Not JSON
};
```

### 3. Input Validation

```typescript
// ✅ GOOD: Zodによる検証
const schema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().uuid().optional(),
});

const result = schema.safeParse(JSON.parse(event.body || "{}"));
if (!result.success) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: result.error.flatten() }),
  };
}

// ❌ BAD: 検証なし
const { message } = JSON.parse(event.body);
```

### 4. Logger Usage

```typescript
// ✅ GOOD: 構造化ログ with requestId
import { logger, runWithRequestId } from "@packages/logger";

export const handler = async (event) => {
  const requestId = event.requestContext?.requestId || randomUUID();

  return runWithRequestId(requestId, async () => {
    logger.info({ event: "request_received", path: event.path });
    // ...
    logger.info({ event: "request_completed", statusCode: 200 });
  });
};

// ❌ BAD: console.log
console.log("Processing request");
```

### 5. Type Safety

```typescript
// ✅ GOOD: 明示的な型
interface ChatRequest {
  message: string;
  sessionId?: string;
}

const request: ChatRequest = result.data;

// ❌ BAD: any型
const request: any = JSON.parse(event.body);
```

### 6. Async Error Handling

```typescript
// ✅ GOOD: try-catch with logging
try {
  const response = await bedrockClient.send(command);
  return { statusCode: 200, body: JSON.stringify(response) };
} catch (error) {
  logger.error({ event: "bedrock_error", error });
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "Internal server error" }),
  };
}

// ❌ BAD: 未処理のエラー
const response = await bedrockClient.send(command);
return { statusCode: 200, body: JSON.stringify(response) };
```

### 7. Environment Variables

```typescript
// ✅ GOOD: 起動時にチェック
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID;
if (!BEDROCK_AGENT_ID) {
  throw new Error("BEDROCK_AGENT_ID is required");
}

// ❌ BAD: 実行時にundefined
const agentId = process.env.BEDROCK_AGENT_ID;  // might be undefined
```

## Project-Specific Patterns

### Handler Lambda (SSE Streaming)

```typescript
// Check for streaming response handling
import { formatSSE, SSEEventType } from "@packages/sse-utils";

// SSE chunk format
responseStream.write(formatSSE({
  event: SSEEventType.CHUNK,
  data: { text, chunkIndex },
}));

// Completion event
responseStream.write(formatSSE({
  event: SSEEventType.COMPLETE,
  data: { sessionId, totalChunks },
}));
```

### Actions Lambda (Tool Router)

```typescript
// Action group routing
switch (actionGroup) {
  case "calculator":
    return handleCalculator(apiPath, parameters);
  case "datetime":
    return handleDateTime(apiPath, parameters);
  case "websearch":
    return handleWebSearch(apiPath, parameters);
  default:
    throw new Error(`Unknown action group: ${actionGroup}`);
}
```

### Bedrock Agent Response Format

```typescript
// Required response structure for action groups
return {
  messageVersion: "1.0",
  response: {
    actionGroup,
    apiPath,
    httpMethod: event.httpMethod,
    httpStatusCode: 200,
    responseBody: {
      "application/json": {
        body: JSON.stringify(result),
      },
    },
  },
};
```

## Test Coverage Expectations

### Grouping by HTTP Status

```typescript
describe("POST /chat", () => {
  describe("HTTP 200", () => {
    it("returns streaming response for valid message", async () => {});
    it("handles session continuation", async () => {});
  });

  describe("HTTP 400", () => {
    it("rejects empty message", async () => {});
    it("rejects message exceeding limit", async () => {});
  });

  describe("HTTP 500", () => {
    it("handles Bedrock errors gracefully", async () => {});
  });
});
```

## Report Format

```markdown
## API Code Review: {File/Component}

### Issues Found
- [ ] {Issue}: {Description} at `file:line`

### Recommendations
- {Suggestion}

### Test Gaps
- Missing test for: {scenario}

### Approved ✅
- {Good patterns observed}
```
