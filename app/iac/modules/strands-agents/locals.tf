locals {
  name_prefix = "strands-agents-${var.environment}"

  # Check if foundation_model is an inference profile (starts with region prefix like "apac.", "us.", "eu.")
  is_inference_profile = can(regex("^(apac|us|eu)\\.", var.foundation_model))

  # Extract base model ID from inference profile (e.g., "amazon.nova-micro-v1:0" from "apac.amazon.nova-micro-v1:0")
  base_model_id = local.is_inference_profile ? replace(var.foundation_model, "/^(apac|us|eu)\\./", "") : var.foundation_model

  # Destination regions for cross-region inference profiles
  # https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html
  inference_profile_regions = {
    apac = ["ap-southeast-2", "ap-northeast-1", "ap-south-1", "ap-northeast-2", "ap-southeast-1", "ap-northeast-3"]
    us   = ["us-east-1", "us-east-2", "us-west-2"]
    eu   = ["eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3"]
  }

  # Get the geography prefix (apac, us, eu) from the inference profile
  inference_profile_geography = local.is_inference_profile ? regex("^(apac|us|eu)", var.foundation_model)[0] : null

  # Foundation model ARN for IAM policies
  # - Inference profiles: arn:aws:bedrock:{region}:{account}:inference-profile/{profile-id}
  # - Direct models: arn:aws:bedrock:{region}::foundation-model/{model-id}
  foundation_model_arn = local.is_inference_profile ? "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/${var.foundation_model}" : "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.foundation_model}"

  # Foundation model ARNs for all destination regions (required for cross-region inference)
  cross_region_model_arns = local.is_inference_profile ? [
    for region in local.inference_profile_regions[local.inference_profile_geography] :
    "arn:aws:bedrock:${region}::foundation-model/${local.base_model_id}"
  ] : []

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
