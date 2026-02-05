import { randomUUID } from "node:crypto";
import type { InvokeAgentCommandOutput } from "@aws-sdk/client-bedrock-agent-runtime";
import { createJsonResponse, createSseResponse } from "@packages/lambda-http";
import { logger } from "@packages/logger";
import { parseJsonBody, validateNonEmptyString } from "@packages/request-utils";
import {
  type ChunkEventData,
  type CompleteEventData,
  type ErrorEventData,
  formatSSE,
  SSEEventType,
} from "@packages/sse-utils";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { invokeAgent } from "../bedrock.js";

interface ChatRequest {
  message: string;
  sessionId?: string;
}

const textDecoder = new TextDecoder();

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

export const handleChat = async (
  event: APIGatewayProxyEventV2,
  requestId: string,
) => {
  const body = parseJsonBody<ChatRequest>(event.body);
  if (!body) {
    return createJsonResponse(400, { error: "Invalid JSON body" });
  }

  const { message, sessionId = randomUUID() } = body;
  const trimmedMessage = validateNonEmptyString(message);
  if (!trimmedMessage) {
    return createJsonResponse(400, { error: "Message is required" });
  }

  logger.info({
    event: "chat_request",
    sessionId,
    messageLength: trimmedMessage.length,
  });

  try {
    const response = await invokeAgent(sessionId, trimmedMessage);

    const { chunks, chunkCount, fullResponse } =
      await collectCompletionChunks(response);

    logger.info({
      event: "chat_response",
      sessionId,
      chunkCount,
      responseLength: fullResponse.length,
    });

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
};
