output "lambda_function_url" {
  description = "Lambda Function URL to configure in Slack App"
  value       = module.vuln_scanner.lambda_function_url
}

output "bedrock_agent_id" {
  description = "Bedrock Agent ID"
  value       = module.vuln_scanner.bedrock_agent_id
}
