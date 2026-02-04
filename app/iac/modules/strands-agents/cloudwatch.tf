# CloudWatch Log Group for Handler Lambda
resource "aws_cloudwatch_log_group" "handler" {
  name              = "/aws/lambda/${local.name_prefix}-handler"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# CloudWatch Log Group for Actions Lambda
resource "aws_cloudwatch_log_group" "actions" {
  name              = "/aws/lambda/${local.name_prefix}-actions"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# CloudWatch Alarm for Handler Lambda Errors
resource "aws_cloudwatch_metric_alarm" "handler_errors" {
  count = var.alert_email != "" ? 1 : 0

  alarm_name          = "${local.name_prefix}-handler-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Handler Lambda error rate exceeded threshold"

  dimensions = {
    FunctionName = aws_lambda_function.handler.function_name
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]

  tags = local.common_tags
}

# CloudWatch Alarm for Actions Lambda Errors
resource "aws_cloudwatch_metric_alarm" "actions_errors" {
  count = var.alert_email != "" ? 1 : 0

  alarm_name          = "${local.name_prefix}-actions-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Actions Lambda error rate exceeded threshold"

  dimensions = {
    FunctionName = aws_lambda_function.actions.function_name
  }

  alarm_actions = [aws_sns_topic.alerts[0].arn]

  tags = local.common_tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  count = var.alert_email != "" ? 1 : 0

  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}

# SNS Subscription for Alerts
resource "aws_sns_topic_subscription" "alerts_email" {
  count = var.alert_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}
