import type { BedrockAgentEvent } from "@packages/bedrock-agent-utils";
import {
  getParameter,
  getRequestBody,
  parseIntParameter,
} from "@packages/bedrock-agent-utils";
import { handleCalculator } from "../actions/calculator.js";
import { handleDateTime } from "../actions/datetime.js";
import { handleWebSearch } from "../actions/websearch.js";

export type ActionHandler = (event: BedrockAgentEvent) => Promise<unknown>;

export const handlersByActionGroup: Record<string, ActionHandler> = {
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
