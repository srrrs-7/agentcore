variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "slack_signing_secret" {
  description = "Slack app signing secret"
  type        = string
  sensitive   = true
}

variable "slack_bot_token" {
  description = "Slack bot token (xoxb-...)"
  type        = string
  sensitive   = true
}

variable "allowed_channel_ids" {
  description = "List of Slack channel IDs allowed to use the bot"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}

variable "budget_limit_usd" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 10
}

variable "alert_email" {
  description = "Email address for budget alerts"
  type        = string
  default     = ""
}
