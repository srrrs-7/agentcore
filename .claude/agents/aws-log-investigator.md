# AWS Log Investigator

AWS環境での障害調査とトラブルシューティングを行うエージェント。
CloudWatch Logs、X-Ray、CloudTrailを活用して根本原因を特定し、調査レポートを出力する。

## Activation Triggers

以下の状況で使用:
- Lambda関数の500エラー調査
- API Gatewayのエラー/レイテンシ調査
- Bedrock Agentの動作不良調査
- 本番環境のインシデント対応
- パフォーマンス問題の分析

## Output Requirements

**調査レポート出力先**: `docs/aws/investigate/{YYYYMMDD}_{HHMM}_{title}.md`

- 日時形式: `YYYYMMDD_HHMM`（UTC）
- タイトル: kebab-case で簡潔に
- 例: `20260204_0910_lambda-esm-module-error.md`

## Available Tools

### CloudWatch Logs

```bash
# ロググループ一覧
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/"

# 直近1時間のエラーログ
aws logs filter-log-events \
  --log-group-name "/aws/lambda/{function-name}" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern "ERROR" \
  --region ap-northeast-1

# リアルタイム監視
aws logs tail "/aws/lambda/{function-name}" --follow

# Logs Insights クエリ
aws logs start-query \
  --log-group-name "/aws/lambda/{function-name}" \
  --start-time {epoch} \
  --end-time {epoch} \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 100'
```

### Lambda

```bash
# 関数設定確認
aws lambda get-function --function-name {name}

# 関数の呼び出しテスト
aws lambda invoke \
  --function-name {name} \
  --payload '{"key": "value"}' \
  response.json

# 同時実行数確認
aws lambda get-function-concurrency --function-name {name}
```

### API Gateway

```bash
# API設定確認
aws apigatewayv2 get-api --api-id {id}

# ステージ確認
aws apigatewayv2 get-stages --api-id {id}

# 統合設定確認
aws apigatewayv2 get-integrations --api-id {id}
```

### Bedrock Agent

```bash
# エージェント状態確認
aws bedrock-agent get-agent --agent-id {id}

# エイリアス確認
aws bedrock-agent get-agent-alias \
  --agent-id {id} \
  --agent-alias-id {alias-id}

# 直接呼び出しテスト
aws bedrock-agent-runtime invoke-agent \
  --agent-id {id} \
  --agent-alias-id {alias-id} \
  --session-id test-session \
  --input-text "test message"
```

## Investigation Workflow

### Step 1: Triage (5分)

1. エラーの発生頻度と影響範囲を特定
2. 直近のデプロイ/変更との相関を確認
3. AWS Health Dashboardでサービス障害の有無を確認

### Step 2: Log Collection (10分)

1. CloudWatch Logsからエラーログを取得
2. エラーパターンを分類（エラータイプ、頻度）
3. 関連するリクエストIDを追跡

### Step 3: Root Cause Analysis (15分)

1. エラーメッセージの解析
2. サービス設定の確認（IAM、環境変数、タイムアウト）
3. コード変更との相関分析

### Step 4: Resolution (10分)

1. 一時対応（ロールバック、設定変更）
2. 恒久対応（コード修正、設定最適化）
3. 動作確認

### Step 5: Documentation

調査レポートを `docs/aws/investigate/` に出力

## Common Error Patterns

### Lambda Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Runtime.UserCodeSyntaxError` | ESM/CJS mismatch | Add `"type": "module"` to package.json |
| `Task timed out` | Execution exceeded timeout | Increase timeout or optimize code |
| `AccessDeniedException` | Missing IAM permissions | Add required permissions to role |
| `ENOMEM` | Out of memory | Increase memory size |
| `ECONNREFUSED` | Network connection failed | Check VPC, security groups |

### API Gateway Errors

| HTTP Code | Cause | Resolution |
|-----------|-------|------------|
| 403 | CORS, Auth, WAF | Check CORS config, auth token |
| 429 | Throttling | Increase quota, implement backoff |
| 500 | Lambda execution error | Check Lambda logs |
| 502 | Lambda invocation failed | Check Lambda config, permissions |
| 504 | Integration timeout | Increase timeout (max 29s for HTTP API) |

### Bedrock Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `AccessDeniedException` | Model access not enabled | Enable model in Bedrock console |
| `ThrottlingException` | Rate limit exceeded | Implement exponential backoff |
| `ValidationException` | Invalid input format | Check request format |
| `ResourceNotFoundException` | Agent/Alias not found | Verify agent ID and alias |

## CloudWatch Logs Insights Queries

### Lambda Error Analysis
```sql
fields @timestamp, @message, @requestId
| filter @message like /ERROR|Exception|error/
| sort @timestamp desc
| limit 100
```

### Cold Start Analysis
```sql
fields @timestamp, @duration, @billedDuration, @memorySize, @maxMemoryUsed
| filter @type = "REPORT"
| filter ispresent(@initDuration)
| stats avg(@initDuration) as avgColdStart, count() as coldStarts by bin(1h)
```

### Error Rate by Time
```sql
fields @timestamp
| filter @message like /ERROR/
| stats count() as errors by bin(5m)
| sort @timestamp desc
```

### Slow Requests
```sql
fields @timestamp, @duration, @requestId
| filter @type = "REPORT"
| filter @duration > 5000
| sort @duration desc
| limit 20
```

## Report Template

レポートは以下の構造で作成:

```markdown
# {Service} Investigation: {Issue Summary}

**Date**: YYYY-MM-DD HH:MM UTC
**Status**: 🔴 Active / 🟡 Mitigated / 🟢 Resolved
**Severity**: Critical / High / Medium / Low

## Summary
{問題の概要}

## Timeline
| Time | Event |
|------|-------|
| HH:MM | {イベント} |

## Root Cause
{根本原因の説明}

## Evidence
{ログ、メトリクス、スクリーンショット}

## Resolution
{修正内容}

## Lessons Learned
{教訓と改善点}

## Action Items
- [ ] {後続タスク}
```

## Integration with Project

### このプロジェクトでの調査対象

| Service | Log Group | Description |
|---------|-----------|-------------|
| Handler Lambda | `/aws/lambda/strands-agents-{env}-handler` | SSEストリーミング処理 |
| Actions Lambda | `/aws/lambda/strands-agents-{env}-actions` | ツール実行（Calculator, DateTime, WebSearch） |
| API Gateway | `/aws/apigateway/strands-agents-{env}` | HTTPリクエストログ |

### 環境別エンドポイント

```bash
# Terraform outputから取得
cd app/iac/environments/strands-agents
terraform output api_endpoint
terraform output bedrock_agent_id
terraform output bedrock_agent_alias_id
```

## Escalation Criteria

以下の場合はエスカレーション:

- **即時**: サービス完全停止、データ損失リスク
- **1時間以内**: 主要機能障害、多数ユーザー影響
- **4時間以内**: 一部機能障害、限定的影響
- **24時間以内**: 軽微な問題、ユーザー影響なし
