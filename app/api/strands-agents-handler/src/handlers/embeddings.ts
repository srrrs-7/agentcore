import { createJsonResponse } from "@packages/lambda-http";
import { logger } from "@packages/logger";
import { parseJsonBody, validateNonEmptyString } from "@packages/request-utils";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { invokeEmbeddingModel } from "../bedrock.js";
import { EMBEDDING_MODEL_ID } from "../config.js";

interface EmbeddingRequest {
  text: string;
}

export const handleEmbeddings = async (event: APIGatewayProxyEventV2) => {
  const body = parseJsonBody<EmbeddingRequest>(event.body);
  if (!body) {
    return createJsonResponse(400, { error: "Invalid JSON body" });
  }

  const text = validateNonEmptyString(body.text);
  if (!text) {
    return createJsonResponse(400, { error: "Text is required" });
  }

  logger.info({
    event: "embedding_request",
    textLength: text.length,
    modelId: EMBEDDING_MODEL_ID,
  });

  try {
    const embedding = await invokeEmbeddingModel(text);
    logger.info({
      event: "embedding_response",
      vectorSize: embedding.embedding.length,
    });

    return createJsonResponse(200, {
      modelId: EMBEDDING_MODEL_ID,
      ...embedding,
    });
  } catch (error) {
    logger.error({ event: "embedding_error", error });
    return createJsonResponse(500, {
      error: error instanceof Error ? error.message : "An error occurred",
    });
  }
};
