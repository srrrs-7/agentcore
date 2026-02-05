# Handler Lambda - SSE Streaming
resource "aws_lambda_function" "handler" {
  function_name = "${local.name_prefix}-handler"
  description   = "Streaming chat handler for Strands Agents"

  runtime       = "nodejs24.x"
  architectures = ["arm64"]
  handler       = "index.handler"
  memory_size   = 512
  timeout       = 120 # 2 minutes for streaming

  role = aws_iam_role.handler_lambda.arn

  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256

  environment {
    variables = {
      BEDROCK_AGENT_ID                    = aws_bedrockagent_agent.main.agent_id
      BEDROCK_AGENT_ALIAS_ID              = aws_bedrockagent_agent_alias.main.agent_alias_id
      BEDROCK_EMBEDDING_MODEL_ID           = var.embedding_model_id
      LOG_LEVEL                           = var.environment == "prod" ? "info" : "debug"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.handler_lambda,
  ]
}

# Actions Lambda - Multi-tool Router
resource "aws_lambda_function" "actions" {
  function_name = "${local.name_prefix}-actions"
  description   = "Bedrock Agent action group executor for Strands Agents"

  runtime       = "nodejs24.x"
  architectures = ["arm64"]
  handler       = "index.handler"
  memory_size   = 256
  timeout       = 30

  role = aws_iam_role.actions_lambda.arn

  filename         = data.archive_file.actions.output_path
  source_code_hash = data.archive_file.actions.output_base64sha256

  environment {
    variables = {
      LOG_LEVEL                           = var.environment == "prod" ? "info" : "debug"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.actions_lambda,
  ]
}

# Archive files for Lambda deployment
data "archive_file" "handler" {
  type        = "zip"
  source_dir  = "${path.module}/${var.handler_source_dir}"
  output_path = "${path.module}/.terraform/handler.zip"
}

data "archive_file" "actions" {
  type        = "zip"
  source_dir  = "${path.module}/${var.actions_source_dir}"
  output_path = "${path.module}/.terraform/actions.zip"
}
