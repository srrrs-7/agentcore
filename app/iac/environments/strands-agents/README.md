# Strands Agents - Infrastructure

Streaming chat assistant powered by AWS Bedrock Agents with Server-Sent Events (SSE) for real-time responses.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│  React + Vite   │     │  API Gateway    │     │     Bedrock Agent       │
│  SPA Frontend   │────▶│  HTTP API v2    │────▶│    (Amazon Nova Micro)  │
│                 │◀────│  (SSE Stream)   │◀────│                         │
└─────────────────┘     └─────────────────┘     └───────────┬─────────────┘
                                                            │
                                                            ▼
                                               ┌─────────────────────────┐
                                               │    Lambda Actions       │
                                               │    (Multi-tool Router)  │
                                               │                         │
                                               │  ┌─────┐ ┌────┐ ┌────┐  │
                                               │  │Calc │ │Time│ │Web │  │
                                               │  └─────┘ └────┘ └────┘  │
                                               └─────────────────────────┘
```

## Project Structure

本プロジェクトは Bun ワークスペースを使用したモノレポ構成です。

```
/workspace/main/
├── packages/                              # 共有ライブラリ
│   ├── logger/                            # Pino ロガー (AsyncLocalStorage)
│   │   └── src/index.ts
│   └── sse-utils/                         # SSE フォーマットユーティリティ
│       └── src/index.ts
│
├── app/
│   ├── api/                               # Lambda 関数
│   │   ├── strands-agents-handler/        # SSE ストリーミングハンドラー
│   │   │   ├── src/index.ts               # Bedrock Agent 呼び出し + SSE レスポンス
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   └── strands-agents-actions/        # マルチツールルーター
│   │       ├── src/
│   │       │   ├── index.ts               # アクショングループルーター
│   │       │   └── actions/
│   │       │       ├── calculator.ts      # 数式計算 (mathjs)
│   │       │       ├── datetime.ts        # 時刻取得・タイムゾーン変換
│   │       │       └── websearch.ts       # Web検索 (Tavily API)
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   ├── ui/                                # フロントエンド
│   │   └── strands-agents/                # React + Vite SPA
│   │       ├── src/
│   │       │   ├── App.tsx                # メインアプリ
│   │       │   ├── components/
│   │       │   │   ├── ChatInterface.tsx  # チャット UI
│   │       │   │   ├── MessageList.tsx    # メッセージ一覧
│   │       │   │   ├── MessageBubble.tsx  # メッセージ表示
│   │       │   │   └── MessageInput.tsx   # 入力フォーム
│   │       │   └── lib/
│   │       │       └── api.ts             # SSE クライアント
│   │       ├── package.json
│   │       └── vite.config.ts
│   │
│   └── iac/                               # Terraform インフラ
│       ├── modules/strands-agents/        # 再利用可能モジュール
│       │   ├── api-gateway.tf             # HTTP API v2 + CORS
│       │   ├── lambda.tf                  # Handler + Actions Lambda
│       │   ├── bedrock.tf                 # Agent + 3 Action Groups
│       │   ├── iam.tf                     # 3 IAM ロール
│       │   ├── cloudwatch.tf              # ログ + アラーム
│       │   ├── ssm.tf                     # Parameter Store
│       │   ├── budget.tf                  # コストアラート
│       │   ├── variables.tf
│       │   ├── locals.tf
│       │   └── outputs.tf
│       │
│       └── environments/strands-agents/   # 環境設定 (このディレクトリ)
│           ├── main.tf                    # モジュール呼び出し
│           ├── provider.tf                # AWS プロバイダー
│           ├── variables.tf               # 入力変数
│           ├── terraform.tfvars.example   # 設定例
│           ├── README.md                  # デプロイガイド (このファイル)
│           └── CLAUDE.md                  # Claude Code ガイド
│
└── package.json                           # Bun ワークスペース設定
```

### コンポーネント説明

| コンポーネント | 役割 |
|---------------|------|
| `packages/logger` | リクエストID追跡付きのPinoロガー |
| `packages/sse-utils` | SSE イベントフォーマット (`chunk`, `complete`, `error`) |
| `strands-agents-handler` | API Gateway → Bedrock Agent → SSE レスポンス |
| `strands-agents-actions` | Bedrock Agent から呼び出されるツール実装 |
| `app/ui/strands-agents` | リアルタイムストリーミング対応チャットUI |
| `modules/strands-agents` | Terraform 再利用可能モジュール |
| `environments/strands-agents` | 環境固有の Terraform 設定 |

### リクエストフロー

```
1. ユーザー入力 → ブラウザが POST /chat を送信
2. API Gateway → HTTP API v2 が Handler Lambda にルーティング
3. Handler Lambda → Bedrock Agent を sessionId 付きで呼び出し
4. Bedrock Agent → Claude Haiku がリクエストを処理、必要に応じてアクショングループを呼び出し
5. Actions Lambda → ツールを実行 (calculator, datetime, websearch)
6. SSE レスポンス → Handler がチャンクを API Gateway 経由でブラウザにストリーム
```

## Prerequisites

- AWS Account with Bedrock access enabled
- Terraform >= 1.0
- Bun >= 1.3.5
- Optional: Tavily API key for web search functionality

## Quick Start

### 1. Build Lambda Functions

```bash
# From repository root
cd app/api/strands-agents-handler
bun install
bun run build

cd ../strands-agents-actions
bun install
bun run build
```

### 2. Configure Terraform

```bash
cd app/iac/environments/strands-agents

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your settings
```

### 3. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

### 4. Start Frontend Development

```bash
cd app/ui/strands-agents
bun install

# Set API endpoint
export VITE_API_ENDPOINT=$(cd ../../iac/environments/strands-agents && terraform output -raw api_endpoint)

# Start dev server
bun run dev
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `ap-northeast-1` |
| `foundation_model` | Bedrock model/inference profile ID | `apac.amazon.nova-micro-v1:0` |
| `embedding_model_id` | Bedrock embedding model ID | `amazon.titan-embed-text-v2:0` |
| `allowed_origins` | CORS allowed origins | `["*"]` |
| `alert_email` | Email for budget alerts | `""` (disabled) |
| `websearch_api_key` | Tavily API key | `""` (disabled) |

### CORS Configuration

For production, set specific allowed origins:

```hcl
allowed_origins = ["https://your-app.com"]
```

### Web Search Setup (Optional)

1. Sign up at [Tavily](https://tavily.com) and get an API key
2. Add to `terraform.tfvars`:
   ```hcl
   websearch_api_key = "tvly-xxxxxxxxxxxx"
   ```

## API Endpoint

### POST /chat

Send a chat message and receive streaming SSE response.

**Request:**
```json
{
  "message": "What is 2 + 2?",
  "sessionId": "optional-session-id"
}
```

**Response (SSE Stream):**
```
event: chunk
data: {"text":"The answer","chunkIndex":0}

event: chunk
data: {"text":" is 4.","chunkIndex":1}

event: complete
data: {"sessionId":"abc-123","totalChunks":2}
```

**Error Response:**
```
event: error
data: {"message":"Error description"}
```

### POST /embeddings

Generate an embedding vector for input text.

**Request:**
```json
{
  "text": "Hello, embeddings!"
}
```

**Response:**
```json
{
  "modelId": "amazon.titan-embed-text-v2:0",
  "embedding": [0.0123, -0.0456, 0.0789],
  "inputTextTokenCount": 4
}
```

## Action Groups

### Calculator
- **Path:** `/calculate`
- **Method:** POST
- **Input:** `{ "expression": "2 + 2" }`
- **Supported:** Basic arithmetic, sqrt, sin, cos, log, etc. (mathjs)

### DateTime
- **Path:** `/current-time`
- **Method:** GET
- **Input:** `?timezone=Asia/Tokyo`
- **Output:** ISO8601, Unix timestamp, formatted string

- **Path:** `/convert-timezone`
- **Method:** GET
- **Input:** `?datetime=2024-01-01T12:00:00Z&fromTimezone=UTC&toTimezone=Asia/Tokyo`

### WebSearch
- **Path:** `/search`
- **Method:** GET
- **Input:** `?query=AI news&maxResults=5`
- **Requires:** Tavily API key configured

## Cost Estimation

Monthly cost for 1000 messages/day:

| Service | Cost |
|---------|------|
| API Gateway HTTP API | ~$1 |
| Lambda Handler | ~$5 |
| Lambda Actions | ~$2 |
| Bedrock Amazon Nova Micro | ~$2 |
| CloudWatch Logs | ~$2 |
| **Total** | **~$12/month** |

Budget alert is configured at $20/month (80% threshold).

### Model Choice

Using **Amazon Nova Micro** for optimal cost-performance:
- Input: $0.035/1M tokens
- Output: $0.14/1M tokens
- ~85% cheaper than Claude 3 Haiku

> **Note**: Nova models require inference profile IDs for on-demand throughput.
> Use region-specific profiles: `apac.amazon.nova-micro-v1:0`, `us.amazon.nova-micro-v1:0`, or `eu.amazon.nova-micro-v1:0`.

To switch models, edit `terraform.tfvars`:
```hcl
# Use Claude 3 Haiku instead
foundation_model = "anthropic.claude-3-haiku-20240307-v1:0"
```

## Monitoring

### CloudWatch Logs

```bash
# Handler Lambda logs
aws logs tail /aws/lambda/strands-agents-strands-agents-handler --follow

# Actions Lambda logs
aws logs tail /aws/lambda/strands-agents-strands-agents-actions --follow
```

### Terraform Outputs

```bash
terraform output api_endpoint
terraform output bedrock_agent_id
terraform output bedrock_agent_alias_id
```

## Troubleshooting

### CORS Errors

1. Check `allowed_origins` in `terraform.tfvars`
2. Ensure frontend origin is included
3. Redeploy with `terraform apply`

### Bedrock Agent Errors

1. Check agent preparation status in AWS Console
2. Verify IAM permissions
3. Review CloudWatch Logs for detailed errors

### Web Search Not Working

1. Verify API key is set in Parameter Store:
   ```bash
   aws ssm get-parameter --name /strands-agents/websearch-api-key --with-decryption
   ```
2. Check Tavily API quota
3. Review Actions Lambda logs

## Cleanup

To destroy all resources:

### 1. Disable Bedrock Agent Action Groups

**Important:** Action Groups must be disabled before destruction. AWS returns `409 ConflictException` when trying to delete ENABLED Action Groups.

```bash
# Get Agent ID
AGENT_ID=$(terraform output -raw bedrock_agent_id)

# Disable all Action Groups
for AG_ID in $(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID --agent-version DRAFT --region ap-northeast-1 \
  --query 'actionGroupSummaries[].actionGroupId' --output text); do

  # Get current config
  AG_INFO=$(aws bedrock-agent get-agent-action-group \
    --agent-id $AGENT_ID --agent-version DRAFT \
    --action-group-id $AG_ID --region ap-northeast-1)

  AG_NAME=$(echo "$AG_INFO" | grep -o '"actionGroupName": "[^"]*"' | cut -d'"' -f4)
  LAMBDA_ARN=$(echo "$AG_INFO" | grep -o '"lambda": "[^"]*"' | cut -d'"' -f4)
  SCHEMA=$(echo "$AG_INFO" | grep -o '"payload": "[^"]*"' | cut -d'"' -f4)

  cat << EOF > /tmp/disable-ag.json
{
  "agentId": "$AGENT_ID",
  "agentVersion": "DRAFT",
  "actionGroupId": "$AG_ID",
  "actionGroupName": "$AG_NAME",
  "actionGroupState": "DISABLED",
  "actionGroupExecutor": {"lambda": "$LAMBDA_ARN"},
  "apiSchema": {"payload": "$SCHEMA"}
}
EOF

  aws bedrock-agent update-agent-action-group \
    --cli-input-json file:///tmp/disable-ag.json \
    --region ap-northeast-1 \
    --query 'agentActionGroup.actionGroupState' \
    --output text

  echo "Disabled: $AG_NAME ($AG_ID)"
done
```

### 2. Destroy Infrastructure

```bash
terraform destroy
```

**Warning:** This will delete all infrastructure including logs and data.

### Why is this needed?

The Terraform AWS Provider does not automatically disable Action Groups before deletion. See investigation report: `docs/aws/investigate/20260204_0930_bedrock-action-group-delete-conflict.md`
