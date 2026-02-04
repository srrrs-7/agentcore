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
| Bedrock Agent | `aws_bedrockagent_agent` | Claude Haiku orchestration |
| Action Groups | `aws_bedrockagent_agent_action_group` | OpenAPI schemas for tools |
| IAM Roles | `aws_iam_role` | 3 roles (handler, actions, bedrock) |
| CloudWatch | `aws_cloudwatch_log_group` | Lambda logs (7-day retention) |
| Budget | `aws_budgets_budget` | $20/month cost alert |

## File Structure

```
strands-agents/
├── main.tf                    # Module instantiation
├── variables.tf               # Input variables
├── provider.tf                # AWS provider config
├── terraform.tfvars.example   # Example configuration
├── README.md                  # Deployment guide
└── CLAUDE.md                  # This file
```

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
