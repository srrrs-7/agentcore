# Parameter Store for Web Search API Key (optional)
resource "aws_ssm_parameter" "websearch_api_key" {
  count = var.websearch_api_key != "" ? 1 : 0

  name        = "/strands-agents/websearch-api-key"
  description = "API key for web search service (Tavily, etc.)"
  type        = "SecureString"
  value       = var.websearch_api_key
}
