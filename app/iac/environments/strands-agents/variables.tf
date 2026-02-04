variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "allowed_origins" {
  description = "CORS allowed origins for API Gateway"
  type        = list(string)
  default     = ["*"]
}

variable "alert_email" {
  description = "Email address for alerts (optional)"
  type        = string
  default     = ""
}

variable "websearch_api_key" {
  description = "API key for Tavily web search (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "foundation_model" {
  description = "Bedrock foundation model or inference profile ID"
  type        = string
  default     = "apac.amazon.nova-micro-v1:0"
}
