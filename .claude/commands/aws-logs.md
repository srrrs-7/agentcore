# /aws-logs Command

AWS CloudWatch Logsをクイック表示する。

## Required Context (MUST read)

- /workspace/main/.claude/rules/aws-investigation.md

## What This Command Does

- 指定したLambda関数のログをリアルタイムまたは履歴で表示
- エラーログのフィルタリング
- ログのサマリー表示

## Inputs

- `$ARGUMENTS`:
  - `handler` - Handler Lambdaのログ
  - `actions` - Actions Lambdaのログ
  - `handler errors` - Handler Lambdaのエラーのみ
  - `handler -f` または `handler --follow` - リアルタイム監視
  - 省略時: 両方のLambdaの直近ログを表示

## Prerequisites

- AWS CLI が設定されていること
- 対象リージョン: `ap-northeast-1`

## Execution Steps

### Handler Lambda ログ表示

```bash
# 直近1時間のログ
aws logs filter-log-events \
  --log-group-name "/aws/lambda/strands-agents-dev-handler" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --region ap-northeast-1 \
  --limit 50

# エラーのみ
aws logs filter-log-events \
  --log-group-name "/aws/lambda/strands-agents-dev-handler" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern "ERROR" \
  --region ap-northeast-1

# リアルタイム監視
aws logs tail "/aws/lambda/strands-agents-dev-handler" --follow --region ap-northeast-1
```

### Actions Lambda ログ表示

```bash
# 直近1時間のログ
aws logs filter-log-events \
  --log-group-name "/aws/lambda/strands-agents-dev-actions" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --region ap-northeast-1 \
  --limit 50

# エラーのみ
aws logs filter-log-events \
  --log-group-name "/aws/lambda/strands-agents-dev-actions" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern "ERROR" \
  --region ap-northeast-1

# リアルタイム監視
aws logs tail "/aws/lambda/strands-agents-dev-actions" --follow --region ap-northeast-1
```

### API Gateway ログ表示

```bash
aws logs filter-log-events \
  --log-group-name "/aws/apigateway/strands-agents-dev" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --region ap-northeast-1 \
  --limit 50
```

## Output

ログメッセージをコンソールに表示。重要なログエントリを要約。

## Common Patterns

| パターン | 意味 |
|---------|------|
| `INIT_START` | コールドスタート開始 |
| `INIT_REPORT` | コールドスタート完了 |
| `START RequestId` | リクエスト処理開始 |
| `END RequestId` | リクエスト処理完了 |
| `REPORT RequestId` | 実行メトリクス |
| `ERROR` | エラー発生 |
| `Task timed out` | タイムアウト |

## Log Groups Reference

| Alias | Log Group |
|-------|-----------|
| `handler` | `/aws/lambda/strands-agents-dev-handler` |
| `actions` | `/aws/lambda/strands-agents-dev-actions` |
| `api` | `/aws/apigateway/strands-agents-dev` |
