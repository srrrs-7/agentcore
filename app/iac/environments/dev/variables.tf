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
  description = "Slack bot token"
  type        = string
  sensitive   = true
}

variable "allowed_channel_ids" {
  description = "List of Slack channel IDs allowed to use the bot"
  type        = list(string)
  default     = []
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = ""
}
