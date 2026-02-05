import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  type InvokeAgentCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  AGENT_ALIAS_ID,
  AGENT_ID,
  EMBEDDING_MODEL_ID,
  REGION,
} from "./config.js";

const agentClient = new BedrockAgentRuntimeClient({ region: REGION });
const runtimeClient = new BedrockRuntimeClient({ region: REGION });

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const invokeAgent = async (
  sessionId: string,
  inputText: string,
): Promise<InvokeAgentCommandOutput> => {
  const command = new InvokeAgentCommand({
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS_ID,
    sessionId,
    inputText,
  });

  return agentClient.send(command);
};

export const invokeEmbeddingModel = async (
  text: string,
): Promise<{ embedding: number[]; inputTextTokenCount?: number }> => {
  const payload = JSON.stringify({ inputText: text });

  const command = new InvokeModelCommand({
    modelId: EMBEDDING_MODEL_ID,
    accept: "application/json",
    contentType: "application/json",
    body: textEncoder.encode(payload),
  });

  const response = await runtimeClient.send(command);
  const decodedBody = textDecoder.decode(response.body);
  const parsed = JSON.parse(decodedBody) as {
    embedding?: number[];
    inputTextTokenCount?: number;
  };

  if (!parsed.embedding || !Array.isArray(parsed.embedding)) {
    throw new Error("Embedding response was missing embedding vector");
  }

  return {
    embedding: parsed.embedding,
    inputTextTokenCount: parsed.inputTextTokenCount,
  };
};
