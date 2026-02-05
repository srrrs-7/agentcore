import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { getAwsRegion } from "@packages/aws-config";
import { logger } from "@packages/logger";
import { validateNonEmptyString } from "@packages/request-utils";

interface EmbeddingParams {
  text?: string;
  modelId?: string;
}

interface EmbeddingResponse {
  modelId: string;
  embedding: number[];
  inputTextTokenCount?: number;
}

const runtimeClient = new BedrockRuntimeClient({
  region: getAwsRegion(),
});

const DEFAULT_MODEL_ID =
  process.env.BEDROCK_EMBEDDING_MODEL_ID || "amazon.titan-embed-text-v2:0";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

/**
 * Handle embeddings action group requests
 */
export async function handleEmbeddings(
  apiPath: string,
  params: EmbeddingParams,
): Promise<EmbeddingResponse> {
  if (apiPath !== "/embed") {
    throw new Error(`Unknown embeddings path: ${apiPath}`);
  }

  const text = validateNonEmptyString(params.text);
  if (!text) {
    throw new Error("text parameter is required");
  }

  const modelId = resolveModelId(params.modelId);

  logger.info({
    event: "embeddings_request",
    modelId,
    textLength: text.length,
  });

  const payload = JSON.stringify({ inputText: text });

  const command = new InvokeModelCommand({
    modelId,
    accept: "application/json",
    contentType: "application/json",
    body: textEncoder.encode(payload),
  });

  try {
    const response = await runtimeClient.send(command);
    const decodedBody = textDecoder.decode(response.body);
    const parsed = JSON.parse(decodedBody) as {
      embedding?: number[];
      inputTextTokenCount?: number;
    };

    if (!parsed.embedding || !Array.isArray(parsed.embedding)) {
      throw new Error("Embedding response was missing embedding vector");
    }

    logger.info({
      event: "embeddings_success",
      modelId,
      vectorSize: parsed.embedding.length,
    });

    return {
      modelId,
      embedding: parsed.embedding,
      inputTextTokenCount: parsed.inputTextTokenCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      event: "embeddings_error",
      modelId,
      error: message,
    });
    throw new Error(`Failed to generate embedding: ${message}`);
  }
}
