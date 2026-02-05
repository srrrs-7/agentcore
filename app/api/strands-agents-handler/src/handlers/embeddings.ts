import { createJsonResponse } from "@packages/lambda-http";
import { logger } from "@packages/logger";
import { parseJsonBody, validateNonEmptyString } from "@packages/request-utils";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { invokeEmbeddingModel } from "../bedrock.js";
import { EMBEDDING_MODEL_ID } from "../config.js";

interface EmbeddingRequest {
  text: string;
  modelId?: string;
}

const DEFAULT_MODEL_ID =
  process.env.BEDROCK_EMBEDDING_MODEL_ID || "amazon.titan-embed-text-v2:0";

const resolveModelId = (requested?: string): string => {
  const trimmed = validateNonEmptyString(requested);
  const resolved = trimmed ?? DEFAULT_MODEL_ID;
  const allowlistRaw = process.env.BEDROCK_EMBEDDING_MODEL_ALLOWLIST;
  if (!allowlistRaw) {
    if (resolved !== DEFAULT_MODEL_ID) {
      throw new Error(
        `Requested modelId is not allowed: ${resolved}. Configure BEDROCK_EMBEDDING_MODEL_ALLOWLIST to permit it.`,
      );
    }
    return resolved;
  }

  const allowlist = allowlistRaw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (!allowlist.includes(resolved)) {
    throw new Error(
      `Requested modelId is not allowed: ${resolved}. Allowed: ${allowlist.join(", ")}`,
    );
  }

  return resolved;
};

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
    modelId: body.modelId ?? EMBEDDING_MODEL_ID,
  });

  try {
    const modelId = resolveModelId(body.modelId);
    const embedding = await invokeEmbeddingModel(text, modelId);
    logger.info({
      event: "embedding_response",
      vectorSize: embedding.embedding.length,
    });

    return createJsonResponse(200, {
      modelId,
      ...embedding,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not allowed")) {
      return createJsonResponse(400, { error: error.message });
    }
    logger.error({ event: "embedding_error", error });
    return createJsonResponse(500, {
      error: error instanceof Error ? error.message : "An error occurred",
    });
  }
};
