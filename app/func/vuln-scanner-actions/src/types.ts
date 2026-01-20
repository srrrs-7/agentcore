// Bedrock Agent Action Group Lambda event types
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
    content: Record<string, { properties: ActionParameter[] }>;
  };
  sessionAttributes: Record<string, string>;
  promptSessionAttributes: Record<string, string>;
}

export interface ActionParameter {
  name: string;
  type: string;
  value: string;
}

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
  sessionAttributes?: Record<string, string>;
  promptSessionAttributes?: Record<string, string>;
}

// NVD API response types
export interface NvdCveResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: NvdVulnerability[];
}

export interface NvdVulnerability {
  cve: {
    id: string;
    sourceIdentifier: string;
    published: string;
    lastModified: string;
    descriptions: Array<{ lang: string; value: string }>;
    metrics?: {
      cvssMetricV31?: Array<{
        cvssData: {
          baseScore: number;
          baseSeverity: string;
        };
      }>;
    };
    configurations?: Array<{
      nodes: Array<{
        cpeMatch: Array<{
          vulnerable: boolean;
          criteria: string;
          versionEndExcluding?: string;
          versionStartIncluding?: string;
        }>;
      }>;
    }>;
  };
}

// OSV API response types
export interface OsvQueryRequest {
  package: {
    name: string;
    ecosystem: string;
  };
}

export interface OsvQueryResponse {
  vulns?: OsvVulnerability[];
}

export interface OsvVulnerability {
  id: string;
  summary: string;
  details: string;
  severity?: Array<{
    type: string;
    score: string;
  }>;
  affected: Array<{
    package: {
      name: string;
      ecosystem: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{ introduced?: string; fixed?: string }>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{
    type: string;
    url: string;
  }>;
}
