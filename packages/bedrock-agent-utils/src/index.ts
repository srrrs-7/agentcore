/**
 * Bedrock Agent event structure
 */
export interface BedrockAgentEvent {
  messageVersion: string;
  agent: {
    name: string;
    id: string;
    alias: string;
    version: string;
  };
  inputText: string;
  sessionId: string;
  actionGroup: string;
  apiPath: string;
  httpMethod: string;
  parameters: ActionParameter[];
  requestBody?: {
    content: {
      "application/json": {
        properties: ActionParameter[];
      };
    };
  };
  sessionAttributes: Record<string, string>;
  promptSessionAttributes: Record<string, string>;
}

export interface ActionParameter {
  name: string;
  type: string;
  value: string;
}

/**
 * Bedrock Agent response structure
 */
export interface BedrockAgentResponse {
  messageVersion: string;
  response: {
    actionGroup: string;
    apiPath: string;
    httpMethod: string;
    httpStatusCode: number;
    responseBody: {
      "application/json": {
        body: string;
      };
    };
  };
}

/**
 * Create a standardized response for Bedrock Agent
 */
export const createResponse = (
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
export const getParameter = (
  event: BedrockAgentEvent,
  name: string,
): string | undefined => {
  const param = event.parameters.find((p) => p.name === name);
  if (param) {
    return param.value;
  }

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
export const getRequestBody = (
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

export const parseIntParameter = (
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
