import { randomUUID } from "node:crypto";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  type InvokeAgentCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { logger, runWithRequestId } from "@packages/logger";
import {
  type ChunkEventData,
  type CompleteEventData,
  type ErrorEventData,
  formatSSE,
  SSEEventType,
} from "@packages/sse-utils";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
});

const AGENT_ID = process.env.BEDROCK_AGENT_ID || "";
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || "";
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

interface ChatRequest {
  message: string;
  sessionId?: string;
}

type JsonResponseBody = Record<string, unknown>;

const textDecoder = new TextDecoder();

const createJsonResponse = (
  statusCode: number,
  body: JsonResponseBody,
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

const createSseResponse = (
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

const parseJsonBody = (body: string | null | undefined): ChatRequest | null => {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as ChatRequest;
  } catch {
    return null;
  }
};

const validateMessage = (message: unknown): string | null => {
  if (typeof message !== "string") {
    return null;
  }
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const collectCompletionChunks = async (
  response: InvokeAgentCommandOutput,
): Promise<{ chunks: string[]; chunkCount: number; fullResponse: string }> => {
  const chunks: string[] = [];
  let chunkCount = 0;

  if (response.completion) {
    for await (const event of response.completion) {
      if (event.chunk?.bytes) {
        const text = textDecoder.decode(event.chunk.bytes);
        chunks.push(text);
        chunkCount++;
      }
    }
  }

  return {
    chunks,
    chunkCount,
    fullResponse: chunks.join(""),
  };
};

const buildSseBody = (chunks: string[], sessionId: string): string => {
  const chunkEvents = chunks
    .map((text, index) =>
      formatSSE({
        event: SSEEventType.CHUNK,
        data: { text, chunkIndex: index } as ChunkEventData,
      }),
    )
    .join("");

  const completeEvent = formatSSE({
    event: SSEEventType.COMPLETE,
    data: { sessionId, totalChunks: chunks.length } as CompleteEventData,
  });

  return chunkEvents + completeEvent;
};

/**
 * Lambda handler for chat requests with SSE streaming response
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || randomUUID();

  return runWithRequestId(requestId, async () => {
    logger.info({
      event: "request_received",
      path: event.rawPath,
      method: event.requestContext?.http?.method,
    });

    // Only accept POST requests
    if (event.requestContext?.http?.method !== "POST") {
      return createJsonResponse(405, { error: "Method not allowed" });
    }

    // Parse request body
    const body = parseJsonBody(event.body);
    if (!body) {
      return createJsonResponse(400, { error: "Invalid JSON body" });
    }

    const { message, sessionId = randomUUID() } = body;
    const trimmedMessage = validateMessage(message);
    if (!trimmedMessage) {
      return createJsonResponse(400, { error: "Message is required" });
    }

    logger.info({
      event: "chat_request",
      sessionId,
      messageLength: trimmedMessage.length,
    });

    try {
      // Invoke Bedrock Agent
      const command = new InvokeAgentCommand({
        agentId: AGENT_ID,
        agentAliasId: AGENT_ALIAS_ID,
        sessionId,
        inputText: trimmedMessage,
      });

      const response = await bedrockClient.send(command);

      // Collect streaming response
      const { chunks, chunkCount, fullResponse } =
        await collectCompletionChunks(response);

      logger.info({
        event: "chat_response",
        sessionId,
        chunkCount,
        responseLength: fullResponse.length,
      });

      // Build SSE response body
      const sseBody = buildSseBody(chunks, sessionId);
      return createSseResponse(sseBody, requestId, sessionId);
    } catch (error) {
      logger.error({ event: "chat_error", error, sessionId });

      const errorEvent = formatSSE({
        event: SSEEventType.ERROR,
        data: {
          message: error instanceof Error ? error.message : "An error occurred",
        } as ErrorEventData,
      });

      return createSseResponse(errorEvent, requestId);
    }
  });
};
