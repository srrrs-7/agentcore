locals {
  name_prefix = "strands-agents-${var.environment}"

  common_tags = {
    Project     = "strands-agents"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
