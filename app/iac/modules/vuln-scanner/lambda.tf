# Slack Handler Lambda
resource "aws_lambda_function" "handler" {
  function_name = "${local.name_prefix}-handler"
  description   = "Handles Slack slash commands for vulnerability scanning"

  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  handler       = "index.handler"
  memory_size   = 256
  timeout       = 30

  role = aws_iam_role.handler_lambda.arn

  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256

  environment {
    variables = {
      BEDROCK_AGENT_ID       = aws_bedrockagent_agent.main.id
      BEDROCK_AGENT_ALIAS_ID = aws_bedrockagent_agent_alias.main.agent_alias_id
      LOG_LEVEL              = var.environment == "prod" ? "info" : "debug"
    }
  }

  depends_on = [aws_cloudwatch_log_group.handler]

  tags = local.common_tags
}

# Lambda Function URL (API Gateway alternative - free)
resource "aws_lambda_function_url" "handler" {
  function_name      = aws_lambda_function.handler.function_name
  authorization_type = "NONE" # Slack signature verification in code
}

# Action Group Lambda
resource "aws_lambda_function" "actions" {
  function_name = "${local.name_prefix}-actions"
  description   = "Bedrock Agent action group for vulnerability search APIs"

  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  handler       = "index.handler"
  memory_size   = 128
  timeout       = 15

  role = aws_iam_role.actions_lambda.arn

  filename         = data.archive_file.actions.output_path
  source_code_hash = data.archive_file.actions.output_base64sha256

  environment {
    variables = {
      LOG_LEVEL = var.environment == "prod" ? "info" : "debug"
    }
  }

  depends_on = [aws_cloudwatch_log_group.actions]

  tags = local.common_tags
}

# Lambda permission for Bedrock Agent
resource "aws_lambda_permission" "bedrock_agent" {
  statement_id  = "AllowBedrockAgentInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.actions.function_name
  principal     = "bedrock.amazonaws.com"
  source_arn    = aws_bedrockagent_agent.main.agent_arn
}

# Placeholder archive files (replace with actual build artifacts)
data "archive_file" "handler" {
  type        = "zip"
  source_dir  = "${path.module}/../../../../func/vuln-scanner/dist"
  output_path = "${path.module}/.terraform/handler.zip"
}

data "archive_file" "actions" {
  type        = "zip"
  source_dir  = "${path.module}/../../../../func/vuln-scanner-actions/dist"
  output_path = "${path.module}/.terraform/actions.zip"
}
