# API Gateway HTTP API v2 with streaming support
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "Strands Agents Chat API with SSE streaming"

  cors_configuration {
    allow_origins     = var.allowed_origins
    allow_methods     = ["POST", "OPTIONS"]
    allow_headers     = ["content-type", "x-request-id", "authorization"]
    expose_headers    = ["x-request-id"]
    max_age           = 300
    allow_credentials = false
  }
}

# Lambda integration for handler
resource "aws_apigatewayv2_integration" "handler" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.handler.invoke_arn

  payload_format_version = "2.0"
  timeout_milliseconds   = 29000 # Max for HTTP API v2 (29s, leaving 1s buffer)
}

# POST /chat route
resource "aws_apigatewayv2_route" "chat" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /chat"
  target    = "integrations/${aws_apigatewayv2_integration.handler.id}"
}

# POST /embeddings route
resource "aws_apigatewayv2_route" "embeddings" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /embeddings"
  target    = "integrations/${aws_apigatewayv2_integration.handler.id}"
}

# Default stage with auto-deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      ip                 = "$context.identity.sourceIp"
      requestTime        = "$context.requestTime"
      httpMethod         = "$context.httpMethod"
      routeKey           = "$context.routeKey"
      status             = "$context.status"
      responseLength     = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
    })
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = var.log_retention_days
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
