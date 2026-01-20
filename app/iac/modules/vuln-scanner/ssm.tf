# Parameter Store for secrets (cost-effective alternative to Secrets Manager)

resource "aws_ssm_parameter" "slack_signing_secret" {
  name        = "/vuln-scanner/slack-signing-secret"
  description = "Slack app signing secret for request verification"
  type        = "SecureString"
  value       = var.slack_signing_secret

  tags = local.common_tags
}

resource "aws_ssm_parameter" "slack_bot_token" {
  name        = "/vuln-scanner/slack-bot-token"
  description = "Slack bot token for posting messages"
  type        = "SecureString"
  value       = var.slack_bot_token

  tags = local.common_tags
}
