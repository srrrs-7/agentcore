import { randomUUID } from "node:crypto";
import { logger, runWithRequestId } from "@packages/logger";
import { searchCve } from "./actions/search-cve.js";
import { searchPackage } from "./actions/search-package.js";
import type { BedrockAgentEvent, BedrockAgentResponse } from "./types.js";

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

const getParameter = (
  event: BedrockAgentEvent,
  name: string,
): string | undefined => {
  return event.parameters.find((p) => p.name === name)?.value;
};

export const handler = async (
  event: BedrockAgentEvent,
): Promise<BedrockAgentResponse> => {
  const requestId = event.sessionId || randomUUID();

  return runWithRequestId(requestId, async () => {
    logger.info({
      event: "action_group_invoked",
      actionGroup: event.actionGroup,
      apiPath: event.apiPath,
      sessionId: event.sessionId,
    });

    try {
      // Route based on API path
      switch (event.apiPath) {
        case "/search-cve": {
          const cveId = getParameter(event, "cveId");
          if (!cveId) {
            return createResponse(event, 400, { error: "cveId is required" });
          }

          const result = await searchCve(cveId);
          if (!result) {
            return createResponse(event, 404, {
              error: `CVE ${cveId} not found`,
            });
          }

          return createResponse(event, 200, result);
        }

        case "/search-package": {
          const packageName = getParameter(event, "packageName");
          if (!packageName) {
            return createResponse(event, 400, {
              error: "packageName is required",
            });
          }

          const ecosystem = getParameter(event, "ecosystem") || "npm";
          const result = await searchPackage(packageName, ecosystem);

          return createResponse(event, 200, result);
        }

        default:
          logger.warn({ event: "unknown_api_path", apiPath: event.apiPath });
          return createResponse(event, 404, {
            error: `Unknown API path: ${event.apiPath}`,
          });
      }
    } catch (error) {
      logger.error({ event: "action_group_error", error });
      return createResponse(event, 500, {
        error: "Internal server error",
      });
    }
  });
};
