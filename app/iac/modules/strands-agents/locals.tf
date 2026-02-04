locals {
  name_prefix = "strands-agents-${var.environment}"

  # Foundation model ARN for IAM policies
  foundation_model_arn = "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.foundation_model}"

  # Lambda function configurations for DRY patterns
  lambda_functions = {
    handler = {
      name        = "handler"
      description = "SSE streaming handler - invokes Bedrock Agent"
    }
    actions = {
      name        = "actions"
      description = "Multi-tool router - calculator, datetime, websearch"
    }
  }

  # Common assume role policies
  assume_role_policies = {
    lambda = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }]
    })
    bedrock = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }]
    })
  }

  # Budget cost filter tag
  budget_tag_filter = "user:Project$strands-agents"

  # Alerts enabled flag
  alerts_enabled = var.alert_email != ""
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
