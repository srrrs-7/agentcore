output "lambda_function_url" {
  description = "Lambda Function URL for Slack webhook"
  value       = aws_lambda_function_url.handler.function_url
}

output "handler_lambda_arn" {
  description = "ARN of the Slack handler Lambda function"
  value       = aws_lambda_function.handler.arn
}

output "actions_lambda_arn" {
  description = "ARN of the action group Lambda function"
  value       = aws_lambda_function.actions.arn
}

output "bedrock_agent_id" {
  description = "Bedrock Agent ID"
  value       = aws_bedrockagent_agent.main.id
}

output "bedrock_agent_alias_id" {
  description = "Bedrock Agent Alias ID"
  value       = aws_bedrockagent_agent_alias.main.agent_alias_id
}
