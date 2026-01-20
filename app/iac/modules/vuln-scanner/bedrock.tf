# Bedrock Agent
resource "aws_bedrockagent_agent" "main" {
  agent_name              = local.name_prefix
  description             = "Vulnerability scanning agent for Slack integration"
  agent_resource_role_arn = aws_iam_role.bedrock_agent.arn
  foundation_model        = "anthropic.claude-3-haiku-20240307-v1:0"

  idle_session_ttl_in_seconds = 600

  instruction = <<-EOT
    あなたは脆弱性調査の専門家です。ユーザーからの問い合わせに対して、
    以下の手順で調査を行ってください：

    1. CVE-IDが指定された場合：search-cve APIで詳細を取得
    2. パッケージ名が指定された場合：search-package APIで既知の脆弱性を検索
    3. 調査結果を日本語で簡潔にまとめる

    回答には以下を含めてください：
    - 脆弱性の概要
    - 影響度（CVSS）
    - 影響を受けるバージョン
    - 推奨される対策

    調査結果が見つからない場合は、その旨を明確に伝えてください。
  EOT

  tags = local.common_tags
}

# Bedrock Agent Alias
resource "aws_bedrockagent_agent_alias" "main" {
  agent_id         = aws_bedrockagent_agent.main.id
  agent_alias_name = var.environment

  tags = local.common_tags
}

# Bedrock Agent Action Group
resource "aws_bedrockagent_agent_action_group" "vuln_search" {
  agent_id          = aws_bedrockagent_agent.main.id
  agent_version     = "DRAFT"
  action_group_name = "vulnerability-search"
  description       = "Actions for searching vulnerability information"

  action_group_executor {
    lambda = aws_lambda_function.actions.arn
  }

  api_schema {
    payload = jsonencode({
      openapi = "3.0.0"
      info = {
        title   = "Vulnerability Search API"
        version = "1.0.0"
      }
      paths = {
        "/search-cve" = {
          get = {
            operationId = "searchCve"
            summary     = "Search CVE details by CVE ID"
            description = "Retrieves vulnerability information from NVD database"
            parameters = [
              {
                name        = "cveId"
                in          = "query"
                required    = true
                description = "CVE identifier (e.g., CVE-2024-1234)"
                schema = {
                  type = "string"
                }
              }
            ]
            responses = {
              "200" = {
                description = "CVE information found"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        cveId            = { type = "string" }
                        description      = { type = "string" }
                        severity         = { type = "string" }
                        cvssScore        = { type = "number" }
                        affectedVersions = { type = "array", items = { type = "string" } }
                        published        = { type = "string" }
                        lastModified     = { type = "string" }
                      }
                    }
                  }
                }
              }
              "404" = {
                description = "CVE not found"
              }
            }
          }
        }
        "/search-package" = {
          get = {
            operationId = "searchPackage"
            summary     = "Search vulnerabilities by package name"
            description = "Retrieves known vulnerabilities for a package from OSV database"
            parameters = [
              {
                name        = "packageName"
                in          = "query"
                required    = true
                description = "Package name (e.g., lodash, @types/node)"
                schema = {
                  type = "string"
                }
              },
              {
                name        = "ecosystem"
                in          = "query"
                required    = false
                description = "Package ecosystem (default: npm)"
                schema = {
                  type    = "string"
                  default = "npm"
                }
              }
            ]
            responses = {
              "200" = {
                description = "Package vulnerability information"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        packageName = { type = "string" }
                        ecosystem   = { type = "string" }
                        vulnerabilities = {
                          type = "array"
                          items = {
                            type = "object"
                            properties = {
                              id               = { type = "string" }
                              summary          = { type = "string" }
                              severity         = { type = "string" }
                              affectedVersions = { type = "array", items = { type = "string" } }
                              fixedVersion     = { type = "string" }
                            }
                          }
                        }
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
