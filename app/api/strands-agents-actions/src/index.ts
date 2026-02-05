import { randomUUID } from "node:crypto";
import type {
  BedrockAgentEvent,
  BedrockAgentResponse,
} from "@packages/bedrock-agent-utils";
import { createResponse } from "@packages/bedrock-agent-utils";
import { logger, runWithRequestId } from "@packages/logger";
import { handlersByActionGroup } from "./handlers/index.js";

/**
 * Lambda handler for Bedrock Agent action groups
 */
export const handler = async (
  event: BedrockAgentEvent,
): Promise<BedrockAgentResponse> => {
  const requestId = event.sessionId || randomUUID();

  return runWithRequestId(requestId, async () => {
    const { actionGroup, apiPath, httpMethod } = event;

    logger.info({
      event: "action_group_invoked",
      actionGroup,
      apiPath,
      httpMethod,
      sessionId: event.sessionId,
    });

    try {
      const handlerForGroup = handlersByActionGroup[actionGroup];
      if (!handlerForGroup) {
        logger.warn({ event: "unknown_action_group", actionGroup });
        return createResponse(event, 400, {
          error: `Unknown action group: ${actionGroup}`,
        });
      }

      const result = await handlerForGroup(event);

      logger.info({
        event: "action_group_success",
        actionGroup,
        apiPath,
      });

      return createResponse(event, 200, result);
    } catch (error) {
      logger.error({
        event: "action_group_error",
        actionGroup,
        apiPath,
        error,
      });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return createResponse(event, 500, {
        error: errorMessage,
      });
    }
  });
};
