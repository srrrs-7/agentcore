import { randomUUID } from "node:crypto";
import { logger, runWithRequestId } from "@packages/logger";
import { handleCalculator } from "./actions/calculator.js";
import { handleDateTime } from "./actions/datetime.js";
import { handleWebSearch } from "./actions/websearch.js";
import type { BedrockAgentEvent, BedrockAgentResponse } from "./types.js";

type ActionHandler = (event: BedrockAgentEvent) => Promise<unknown>;

/**
 * Create a standardized response for Bedrock Agent
 */
const createResponse = (
  event: BedrockAgentEvent,
  statusCode: number,
  body: unknown,
): BedrockAgentResponse => ({
  messageVersion: "1.0",
  response: {
    actionGroup: event.actionGroup,
    apiPath: event.apiPath,
    httpMethod: event.httpMethod,
    httpStatusCode: statusCode,
    responseBody: {
      "application/json": {
        body: JSON.stringify(body),
      },
    },
  },
});

/**
 * Get parameter value from event.
 */
const getParameter = (
  event: BedrockAgentEvent,
  name: string,
): string | undefined => {
  // Check query parameters
  const param = event.parameters.find((p) => p.name === name);
  if (param) {
    return param.value;
  }

  // Check request body
  const bodyParam = event.requestBody?.content?.[
    "application/json"
  ]?.properties.find((p) => p.name === name);
  if (bodyParam) {
    return bodyParam.value;
  }

  return undefined;
};

/**
 * Get request body as object
 */
const getRequestBody = (
  event: BedrockAgentEvent,
): Record<string, string> | undefined => {
  const properties =
    event.requestBody?.content?.["application/json"]?.properties;
  if (!properties) {
    return undefined;
  }

  return properties.reduce(
    (acc, prop) => {
      acc[prop.name] = prop.value;
      return acc;
    },
    {} as Record<string, string>,
  );
};

const parseIntParameter = (
  event: BedrockAgentEvent,
  name: string,
): number | undefined => {
  const value = getParameter(event, name);
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const handlersByActionGroup: Record<string, ActionHandler> = {
  calculator: async (event) => {
    const body = getRequestBody(event);
    return handleCalculator(event.apiPath, body);
  },
  datetime: async (event) =>
    handleDateTime(event.apiPath, {
      timezone: getParameter(event, "timezone"),
      datetime: getParameter(event, "datetime"),
      fromTimezone: getParameter(event, "fromTimezone"),
      toTimezone: getParameter(event, "toTimezone"),
    }),
  websearch: async (event) =>
    handleWebSearch(event.apiPath, {
      query: getParameter(event, "query"),
      maxResults: parseIntParameter(event, "maxResults"),
    }),
};

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
