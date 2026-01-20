import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { logger } from "@packages/logger";

const client = new BedrockAgentRuntimeClient({});

const AGENT_ID = process.env.BEDROCK_AGENT_ID || "";
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || "";

export interface InvokeAgentParams {
  sessionId: string;
  inputText: string;
}

export const invokeAgent = async ({
  sessionId,
  inputText,
}: InvokeAgentParams): Promise<string> => {
  const command = new InvokeAgentCommand({
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS_ID,
    sessionId,
    inputText,
  });

  logger.info({
    event: "bedrock_invoke_start",
    agentId: AGENT_ID,
    sessionId,
  });

  const response = await client.send(command);

  let output = "";

  if (response.completion) {
    for await (const event of response.completion) {
      if (event.chunk?.bytes) {
        output += new TextDecoder().decode(event.chunk.bytes);
      }
    }
  }

  logger.info({
    event: "bedrock_invoke_complete",
    agentId: AGENT_ID,
    sessionId,
    outputLength: output.length,
  });

  return output;
};
