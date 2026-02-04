module "strands_agents" {
  source = "../../modules/strands-agents"

  environment       = "strands-agents"
  aws_region        = var.aws_region
  allowed_origins   = var.allowed_origins
  log_retention_days = 7
  budget_limit_usd  = 20
  alert_email       = var.alert_email
  websearch_api_key = var.websearch_api_key
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.strands_agents.api_endpoint
}

output "handler_lambda_name" {
  description = "Handler Lambda function name"
  value       = module.strands_agents.handler_lambda_name
}

output "actions_lambda_name" {
  description = "Actions Lambda function name"
  value       = module.strands_agents.actions_lambda_name
}

output "bedrock_agent_id" {
  description = "Bedrock Agent ID"
  value       = module.strands_agents.bedrock_agent_id
}

output "bedrock_agent_alias_id" {
  description = "Bedrock Agent Alias ID"
  value       = module.strands_agents.bedrock_agent_alias_id
}
