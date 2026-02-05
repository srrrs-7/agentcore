import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { getAwsRegion } from "@packages/aws-config";
import { logger } from "@packages/logger";
import { validateNonEmptyString } from "@packages/request-utils";

const ssmClient = new SSMClient({
  region: getAwsRegion(),
});

interface WebSearchParams {
  query?: string;
  maxResults?: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface WebSearchResponse {
  query: string;
  results: SearchResult[];
}

/**
 * Get web search API key from Parameter Store
 */
async function getWebSearchApiKey(): Promise<string | null> {
  try {
    const command = new GetParameterCommand({
      Name: "/strands-agents/websearch-api-key",
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);
    return response.Parameter?.Value || null;
  } catch (error) {
    logger.warn({
      event: "websearch_api_key_not_found",
      error,
    });
    return null;
  }
}

/**
 * Handle websearch action group requests
 */
export async function handleWebSearch(
  apiPath: string,
  params: WebSearchParams,
): Promise<WebSearchResponse> {
  if (apiPath !== "/search") {
    throw new Error(`Unknown websearch path: ${apiPath}`);
  }

  const { maxResults = 5 } = params;
  const query = validateNonEmptyString(params.query);

  if (!query) {
    throw new Error("query parameter is required");
  }

  logger.info({
    event: "websearch_request",
    query,
    maxResults,
  });

  // Get API key
  const apiKey = await getWebSearchApiKey();

  if (!apiKey) {
    logger.warn({
      event: "websearch_no_api_key",
    });

    // Return mock results when no API key is configured
    return {
      query,
      results: [
        {
          title: "Web Search Not Configured",
          url: "https://example.com",
          snippet:
            "Web search API key is not configured. Please set the /strands-agents/websearch-api-key parameter in AWS Parameter Store.",
        },
      ],
    };
  }

  try {
    // Call Tavily API
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: Math.min(maxResults, 10),
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Tavily API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    logger.info({
      event: "websearch_success",
      query,
      resultCount: data.results?.length || 0,
    });

    return {
      query,
      results: (data.results || []).map(
        (r: { title: string; url: string; content: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
        }),
      ),
    };
  } catch (error) {
    logger.error({
      event: "websearch_error",
      query,
      error,
    });

    const message = error instanceof Error ? error.message : "Search failed";
    throw new Error(`Web search failed: ${message}`);
  }
}
