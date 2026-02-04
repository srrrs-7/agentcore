variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "allowed_origins" {
  description = "CORS allowed origins for API Gateway"
  type        = list(string)
  default     = ["*"]
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "budget_limit_usd" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 20
}

variable "alert_email" {
  description = "Email address for budget alerts (optional)"
  type        = string
  default     = ""
}

variable "websearch_api_key" {
  description = "API key for web search service (Tavily, etc.)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "handler_source_dir" {
  description = "Path to handler Lambda source directory"
  type        = string
  default     = "../../../../api/strands-agents-handler/dist"
}

variable "actions_source_dir" {
  description = "Path to actions Lambda source directory"
  type        = string
  default     = "../../../../api/strands-agents-actions/dist"
}
