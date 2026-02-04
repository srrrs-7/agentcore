# Strands Agents Environment - Claude Code Guide

This file provides guidance for working with the Strands Agents infrastructure.

## Quick Commands

```bash
# Deploy infrastructure
terraform init
terraform plan
terraform apply

# Get outputs
terraform output api_endpoint
terraform output bedrock_agent_id

# View logs
aws logs tail /aws/lambda/strands-agents-strands-agents-handler --follow
aws logs tail /aws/lambda/strands-agents-strands-agents-actions --follow
```

## Infrastructure Components

| Component | Resource Type | Purpose |
|-----------|---------------|---------|
| API Gateway | `aws_apigatewayv2_api` | HTTP API v2 with SSE streaming |
| Handler Lambda | `aws_lambda_function` | Invokes Bedrock Agent, streams response |
| Actions Lambda | `aws_lambda_function` | Executes calculator/datetime/websearch tools |
| Bedrock Agent | `aws_bedrockagent_agent` | Amazon Nova Micro orchestration |
| Action Groups | `aws_bedrockagent_agent_action_group` | OpenAPI schemas for tools |
| IAM Roles | `aws_iam_role` | 3 roles (handler, actions, bedrock) |
| CloudWatch | `aws_cloudwatch_log_group` | Lambda logs (7-day retention) |
| Budget | `aws_budgets_budget` | $20/month cost alert |

## Tag Management

All resources are automatically tagged via AWS provider's `default_tags`:

| Tag | Value | Description |
|-----|-------|-------------|
| `Project` | `strands-agents` | Project identifier for cost tracking |
| `Environment` | `var.environment` | Environment name (dev/staging/prod) |
| `ManagedBy` | `terraform` | Infrastructure management tool |

### Adding Custom Tags

Edit `terraform.tfvars` to add additional tags:

```hcl
tags = {
  CostCenter = "engineering"
  Owner      = "team-name"
}
```

Tags are applied automatically to all AWS resources without explicit `tags` blocks in module resources.

## File Structure

```
strands-agents/
├── main.tf                    # Module instantiation
├── variables.tf               # Input variables (environment, tags, etc.)
├── provider.tf                # AWS provider config with default_tags
├── terraform.tfvars.example   # Example configuration
├── README.md                  # Deployment guide
└── CLAUDE.md                  # This file
```

## Input Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `environment` | string | `"dev"` | Environment name for naming/tagging |
| `aws_region` | string | `"ap-northeast-1"` | AWS region |
| `foundation_model` | string | `"apac.amazon.nova-micro-v1:0"` | Bedrock model/inference profile ID |
| `allowed_origins` | list(string) | `["*"]` | CORS allowed origins |
| `alert_email` | string | `""` | Email for budget/error alerts |
| `websearch_api_key` | string | `""` | Tavily API key (sensitive) |
| `tags` | map(string) | `{}` | Additional tags for all resources |

## Common Operations

### Update Lambda Code

```bash
# Rebuild and deploy
cd app/api/strands-agents-handler && bun run build
cd ../strands-agents-actions && bun run build
cd ../../iac/environments/strands-agents
terraform apply
```

### Change CORS Origins

Edit `terraform.tfvars`:
```hcl
allowed_origins = ["https://your-app.com"]
```

Then apply:
```bash
terraform apply
```

### Change Bedrock Model

Edit `terraform.tfvars`:
```hcl
# APAC regions (ap-northeast-1, etc.)
foundation_model = "apac.amazon.nova-micro-v1:0"

# US regions
foundation_model = "us.amazon.nova-micro-v1:0"

# EU regions
foundation_model = "eu.amazon.nova-micro-v1:0"

# Claude 3 Haiku (direct model ID, no inference profile needed)
foundation_model = "anthropic.claude-3-haiku-20240307-v1:0"
```

Then apply:
```bash
terraform apply
```

> **Note**: Amazon Nova models require inference profile IDs (e.g., `apac.amazon.nova-micro-v1:0`) instead of direct model IDs for on-demand throughput.

### Enable Web Search

1. Get API key from [Tavily](https://tavily.com)
2. Add to `terraform.tfvars`:
   ```hcl
   websearch_api_key = "tvly-xxxxxxxxxxxx"
   ```
3. Apply: `terraform apply`

### Debug Bedrock Agent

```bash
# Check agent status in AWS Console
# Bedrock > Agents > strands-agents-strands-agents

# Test agent directly
aws bedrock-agent-runtime invoke-agent \
  --agent-id $(terraform output -raw bedrock_agent_id) \
  --agent-alias-id $(terraform output -raw bedrock_agent_alias_id) \
  --session-id test-session \
  --input-text "What is 2 + 2?"
```

## Troubleshooting

### Agent Not Responding
- Check agent preparation status in console
- Verify IAM role has `bedrock:InvokeModel` permission
- Check Lambda timeout (should be 120s for handler)

### CORS Errors
- Verify `allowed_origins` includes your frontend domain
- Check API Gateway CORS configuration in console

### Action Group Errors
- Review Actions Lambda CloudWatch logs
- Verify OpenAPI schema matches implementation
- Check parameter names match between schema and code
