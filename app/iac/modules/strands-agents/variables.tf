variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-northeast-1"
}

variable "foundation_model" {
  description = "Bedrock foundation model ID (e.g., amazon.nova-micro-v1:0, anthropic.claude-3-haiku-20240307-v1:0)"
  type        = string
  default     = "amazon.nova-micro-v1:0"
}

variable "embedding_model_id" {
  description = "Bedrock embedding model ID (e.g., amazon.titan-embed-text-v2:0)"
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "allowed_origins" {
  description = "CORS allowed origins for API Gateway. Use specific origins in production."
  type        = list(string)
  default     = ["*"]

  validation {
    condition     = length(var.allowed_origins) > 0
    error_message = "At least one allowed origin must be specified"
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch retention period"
  }
}

variable "budget_limit_usd" {
  description = "Monthly budget limit in USD for cost alerts"
  type        = number
  default     = 20

  validation {
    condition     = var.budget_limit_usd > 0
    error_message = "Budget limit must be greater than 0"
  }
}

variable "alert_email" {
  description = "Email address for budget and error alerts (optional, leave empty to disable)"
  type        = string
  default     = ""
}

variable "websearch_api_key" {
  description = "Tavily API key for web search functionality (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "handler_source_dir" {
  description = "Path to handler Lambda dist directory (relative to module)"
  type        = string
  default     = "../../../api/strands-agents-handler/dist"
}

variable "actions_source_dir" {
  description = "Path to actions Lambda dist directory (relative to module)"
  type        = string
  default     = "../../../api/strands-agents-actions/dist"
}
