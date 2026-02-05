import { randomUUID } from "node:crypto";
import { createJsonResponse } from "@packages/lambda-http";
import { logger, runWithRequestId } from "@packages/logger";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { handleChat } from "./handlers/chat.js";
import { handleEmbeddings } from "./handlers/embeddings.js";

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

    if (event.rawPath === "/embeddings") {
      return handleEmbeddings(event);
    }

    if (event.rawPath !== "/chat") {
      return createJsonResponse(404, { error: "Not found" });
    }

    return handleChat(event, requestId);
  });
};
