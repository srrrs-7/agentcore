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
