import { logger, runWithRequestId } from "@packages/logger";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { invokeAgent } from "./bedrock/agent.js";
import { getSecret } from "./secrets.js";
import { parseSlashCommand } from "./slack/parse.js";
import {
  createAgentResponse,
  createErrorResponse,
  createInvalidInputResponse,
  createLoadingResponse,
} from "./slack/response.js";
import { verifySlackSignature } from "./slack/verify.js";
import type { SlackResponse } from "./types.js";
import { validateInput } from "./validation.js";

const postToSlack = async (
  responseUrl: string,
  payload: SlackResponse,
): Promise<void> => {
  const response = await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    logger.error({
      event: "slack_post_error",
      status: response.status,
      statusText: response.statusText,
    });
  }
};

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext?.requestId || crypto.randomUUID();

  return runWithRequestId(requestId, async () => {
    logger.info({
      event: "request_received",
      path: event.rawPath,
      method: event.requestContext?.http?.method,
    });

    // Only accept POST requests
    if (event.requestContext?.http?.method !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = event.body || "";
    const timestamp = event.headers["x-slack-request-timestamp"] || "";
    const signature = event.headers["x-slack-signature"] || "";

    // Verify Slack signature
    try {
      const signingSecret = await getSecret("slack-signing-secret");

      if (!verifySlackSignature(signingSecret, signature, timestamp, body)) {
        logger.warn({ event: "signature_verification_failed" });
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid signature" }),
        };
      }
    } catch (error) {
      logger.error({ event: "signature_verification_error", error });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal error" }),
      };
    }

    // Parse slash command
    const command = parseSlashCommand(body);

    logger.info({
      event: "slack_command",
      userId: command.user_id,
      channelId: command.channel_id,
      commandText: command.text,
    });

    // Validate input
    const validation = validateInput(command.text);

    if (validation.type === "invalid") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createInvalidInputResponse()),
      };
    }

    // Return immediate response to Slack (3 second limit)
    // Process in background and post result to response_url
    const processAsync = async () => {
      try {
        const sessionId = `${command.user_id}-${Date.now()}`;
        const inputText =
          validation.type === "cve"
            ? `CVE ID「${validation.value}」の脆弱性情報を調査してください。`
            : `パッケージ「${validation.value}」の脆弱性情報を調査してください。`;

        const agentOutput = await invokeAgent({ sessionId, inputText });
        await postToSlack(
          command.response_url,
          createAgentResponse(agentOutput),
        );
      } catch (error) {
        logger.error({ event: "agent_invoke_error", error });
        await postToSlack(
          command.response_url,
          createErrorResponse("調査中にエラーが発生しました。"),
        );
      }
    };

    // Fire and forget - Lambda will continue running
    void processAsync();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createLoadingResponse()),
    };
  });
};
