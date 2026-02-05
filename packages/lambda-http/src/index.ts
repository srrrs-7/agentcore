import type { APIGatewayProxyResultV2 } from "aws-lambda";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

type JsonResponseBody = Record<string, unknown>;

export const createJsonResponse = (
  statusCode: number,
  body: JsonResponseBody,
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

export const createSseResponse = (
  body: string,
  requestId: string,
  sessionId?: string,
): APIGatewayProxyResultV2 => ({
  statusCode: 200,
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Request-Id": requestId,
    ...(sessionId ? { "X-Session-Id": sessionId } : {}),
  },
  body,
});
