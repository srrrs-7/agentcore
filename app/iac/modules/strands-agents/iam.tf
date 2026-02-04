# =============================================================================
# Handler Lambda IAM Role
# =============================================================================

resource "aws_iam_role" "handler_lambda" {
  name               = "${local.name_prefix}-handler-role"
  description        = "IAM role for Handler Lambda to invoke Bedrock Agent and write logs"
  assume_role_policy = local.assume_role_policies.lambda
}

resource "aws_iam_role_policy" "handler_lambda" {
  name = "${local.name_prefix}-handler-policy"
  role = aws_iam_role.handler_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda["handler"].arn}:*"
      },
      {
        Sid    = "BedrockAgentInvoke"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeAgent"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:agent-alias/${aws_bedrockagent_agent.main.agent_id}/*"
      }
    ]
  })
}

# =============================================================================
# Actions Lambda IAM Role
# =============================================================================

resource "aws_iam_role" "actions_lambda" {
  name               = "${local.name_prefix}-actions-role"
  description        = "IAM role for Actions Lambda to execute tools and access Parameter Store"
  assume_role_policy = local.assume_role_policies.lambda
}

resource "aws_iam_role_policy" "actions_lambda" {
  name = "${local.name_prefix}-actions-policy"
  role = aws_iam_role.actions_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda["actions"].arn}:*"
      },
      {
        Sid    = "ParameterStoreAccess"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/strands-agents/*"
      }
    ]
  })
}

# =============================================================================
# Bedrock Agent IAM Role
# =============================================================================

resource "aws_iam_role" "bedrock_agent" {
  name               = "${local.name_prefix}-bedrock-agent-role"
  description        = "IAM role for Bedrock Agent to invoke foundation model and Lambda functions"
  assume_role_policy = local.assume_role_policies.bedrock
}

resource "aws_iam_role_policy" "bedrock_agent" {
  name = "${local.name_prefix}-bedrock-agent-policy"
  role = aws_iam_role.bedrock_agent.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockModelInvoke"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = local.foundation_model_arn
      },
      {
        Sid    = "LambdaInvoke"
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.actions.arn
      }
    ]
  })
}

# =============================================================================
# Lambda Permissions
# =============================================================================

# Allow Bedrock Agent to invoke Actions Lambda
resource "aws_lambda_permission" "bedrock_agent" {
  statement_id  = "AllowBedrockAgentInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.actions.function_name
  principal     = "bedrock.amazonaws.com"
  source_arn    = aws_bedrockagent_agent.main.agent_arn
}
