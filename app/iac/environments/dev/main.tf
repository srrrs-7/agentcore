terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Uncomment to use S3 backend for state management
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "vuln-scanner/dev/terraform.tfstate"
  #   region         = "ap-northeast-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "vuln-scanner"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

module "vuln_scanner" {
  source = "../../modules/vuln-scanner"

  environment          = "dev"
  aws_region           = var.aws_region
  slack_signing_secret = var.slack_signing_secret
  slack_bot_token      = var.slack_bot_token
  allowed_channel_ids  = var.allowed_channel_ids
  log_retention_days   = 7
  budget_limit_usd     = 10
  alert_email          = var.alert_email
}
