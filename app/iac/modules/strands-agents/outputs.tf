output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "handler_lambda_arn" {
  description = "Handler Lambda function ARN"
  value       = aws_lambda_function.handler.arn
}

output "handler_lambda_name" {
  description = "Handler Lambda function name"
  value       = aws_lambda_function.handler.function_name
}

output "actions_lambda_arn" {
  description = "Actions Lambda function ARN"
  value       = aws_lambda_function.actions.arn
}

output "actions_lambda_name" {
  description = "Actions Lambda function name"
  value       = aws_lambda_function.actions.function_name
}

output "bedrock_agent_id" {
  description = "Bedrock Agent ID"
  value       = aws_bedrockagent_agent.main.agent_id
}

output "bedrock_agent_alias_id" {
  description = "Bedrock Agent Alias ID"
  value       = aws_bedrockagent_agent_alias.main.agent_alias_id
}

output "cloudwatch_log_group_handler" {
  description = "CloudWatch Log Group for Handler Lambda"
  value       = aws_cloudwatch_log_group.handler.name
}

output "cloudwatch_log_group_actions" {
  description = "CloudWatch Log Group for Actions Lambda"
  value       = aws_cloudwatch_log_group.actions.name
}
