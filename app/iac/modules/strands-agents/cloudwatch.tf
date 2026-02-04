# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${local.name_prefix}-${each.key}"
  retention_in_days = var.log_retention_days
}

# CloudWatch Alarms for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.alerts_enabled ? local.lambda_functions : {}

  alarm_name          = "${local.name_prefix}-${each.key}-errors"
  alarm_description   = "${each.value.description} - error rate exceeded threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5

  dimensions = {
    FunctionName = "${local.name_prefix}-${each.key}"
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  count = local.alerts_enabled ? 1 : 0

  name = "${local.name_prefix}-alerts"
}

# SNS Email Subscription
resource "aws_sns_topic_subscription" "alerts_email" {
  count = local.alerts_enabled ? 1 : 0

  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}
