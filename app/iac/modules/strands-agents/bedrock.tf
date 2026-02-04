# Bedrock Agent
resource "aws_bedrockagent_agent" "main" {
  agent_name              = local.name_prefix
  description             = "General purpose chat assistant with multiple tools"
  agent_resource_role_arn = aws_iam_role.bedrock_agent.arn
  foundation_model        = "anthropic.claude-3-haiku-20240307-v1:0"

  idle_session_ttl_in_seconds = 1800 # 30 minutes

  instruction = <<-EOT
    You are a helpful AI assistant with access to multiple tools.
    Use the available tools to help users with:
    - Mathematical calculations (use calculator tool)
    - Current date/time information and timezone conversions (use datetime tool)
    - Web searches for current information (use websearch tool)

    Guidelines:
    - Be concise, friendly, and accurate
    - Always cite sources when using web search results
    - If you're unsure about something, say so rather than guessing
    - Use tools proactively when they would help answer the user's question
    - Respond in the same language as the user's question
  EOT

  tags = local.common_tags
}

# Agent Alias
resource "aws_bedrockagent_agent_alias" "main" {
  agent_id         = aws_bedrockagent_agent.main.agent_id
  agent_alias_name = var.environment

  tags = local.common_tags
}

# Action Group: Calculator
resource "aws_bedrockagent_agent_action_group" "calculator" {
  agent_id          = aws_bedrockagent_agent.main.agent_id
  agent_version     = "DRAFT"
  action_group_name = "calculator"
  description       = "Perform mathematical calculations"

  action_group_executor {
    lambda = aws_lambda_function.actions.arn
  }

  api_schema {
    payload = jsonencode({
      openapi = "3.0.0"
      info = {
        title   = "Calculator API"
        version = "1.0.0"
      }
      paths = {
        "/calculate" = {
          post = {
            operationId = "calculate"
            summary     = "Evaluate a mathematical expression"
            description = "Evaluates mathematical expressions including basic arithmetic, square roots, trigonometry, logarithms, etc."
            requestBody = {
              required = true
              content = {
                "application/json" = {
                  schema = {
                    type     = "object"
                    required = ["expression"]
                    properties = {
                      expression = {
                        type        = "string"
                        description = "Mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'sin(45 deg)')"
                      }
                    }
                  }
                }
              }
            }
            responses = {
              "200" = {
                description = "Calculation result"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        result     = { type = "number", description = "Calculated result" }
                        expression = { type = "string", description = "Original expression" }
                      }
                    }
                  }
                }
              }
              "400" = {
                description = "Invalid expression"
              }
            }
          }
        }
      }
    })
  }
}

# Action Group: DateTime
resource "aws_bedrockagent_agent_action_group" "datetime" {
  agent_id          = aws_bedrockagent_agent.main.agent_id
  agent_version     = "DRAFT"
  action_group_name = "datetime"
  description       = "Get current time and date information"

  action_group_executor {
    lambda = aws_lambda_function.actions.arn
  }

  api_schema {
    payload = jsonencode({
      openapi = "3.0.0"
      info = {
        title   = "DateTime API"
        version = "1.0.0"
      }
      paths = {
        "/current-time" = {
          get = {
            operationId = "getCurrentTime"
            summary     = "Get current date and time"
            description = "Returns the current date and time in various formats"
            parameters = [
              {
                name        = "timezone"
                in          = "query"
                required    = false
                description = "IANA timezone (e.g., 'Asia/Tokyo', 'America/New_York', 'Europe/London'). Defaults to UTC."
                schema = {
                  type    = "string"
                  default = "UTC"
                }
              }
            ]
            responses = {
              "200" = {
                description = "Current time information"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        iso8601   = { type = "string", description = "ISO 8601 formatted datetime" }
                        unix      = { type = "integer", description = "Unix timestamp in seconds" }
                        timezone  = { type = "string", description = "Timezone used" }
                        formatted = { type = "string", description = "Human-readable formatted datetime" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        "/convert-timezone" = {
          get = {
            operationId = "convertTimezone"
            summary     = "Convert time between timezones"
            description = "Converts a datetime from one timezone to another"
            parameters = [
              {
                name        = "datetime"
                in          = "query"
                required    = true
                description = "ISO 8601 datetime string to convert"
                schema      = { type = "string" }
              },
              {
                name        = "fromTimezone"
                in          = "query"
                required    = true
                description = "Source timezone (IANA format)"
                schema      = { type = "string" }
              },
              {
                name        = "toTimezone"
                in          = "query"
                required    = true
                description = "Target timezone (IANA format)"
                schema      = { type = "string" }
              }
            ]
            responses = {
              "200" = {
                description = "Converted time"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        original  = { type = "string" }
                        converted = { type = "string" }
                        fromTimezone = { type = "string" }
                        toTimezone   = { type = "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  }
}

# Action Group: WebSearch
resource "aws_bedrockagent_agent_action_group" "websearch" {
  agent_id          = aws_bedrockagent_agent.main.agent_id
  agent_version     = "DRAFT"
  action_group_name = "websearch"
  description       = "Search the web for current information"

  action_group_executor {
    lambda = aws_lambda_function.actions.arn
  }

  api_schema {
    payload = jsonencode({
      openapi = "3.0.0"
      info = {
        title   = "WebSearch API"
        version = "1.0.0"
      }
      paths = {
        "/search" = {
          get = {
            operationId = "searchWeb"
            summary     = "Search the web"
            description = "Searches the web for current information and returns relevant results"
            parameters = [
              {
                name        = "query"
                in          = "query"
                required    = true
                description = "Search query"
                schema      = { type = "string" }
              },
              {
                name        = "maxResults"
                in          = "query"
                required    = false
                description = "Maximum number of results to return (default: 5, max: 10)"
                schema = {
                  type    = "integer"
                  default = 5
                  minimum = 1
                  maximum = 10
                }
              }
            ]
            responses = {
              "200" = {
                description = "Search results"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        query = { type = "string", description = "Original search query" }
                        results = {
                          type = "array"
                          items = {
                            type = "object"
                            properties = {
                              title   = { type = "string", description = "Result title" }
                              url     = { type = "string", description = "Result URL" }
                              snippet = { type = "string", description = "Result snippet/summary" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              "503" = {
                description = "Web search service unavailable"
              }
            }
          }
        }
      }
    })
  }
}
