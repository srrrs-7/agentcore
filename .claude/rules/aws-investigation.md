# AWS Investigation Rules

AWS障害調査のベストプラクティスに基づく調査手順とレポート作成ルール。

## Report Output Location

すべてのAWS調査レポートは以下のディレクトリに出力:

```
docs/aws/investigate/
├── {YYYYMMDD}_{HHMM}_{title}.md
└── ...
```

**ファイル命名規則**: `{日時}_{タイトル}.md`
- 日時形式: `YYYYMMDD_HHMM`（UTC）
- タイトル: kebab-case で簡潔に

**例**:
- `20260204_0910_lambda-esm-module-error.md`
- `20260204_1530_api-gateway-cors-blocked.md`
- `20260205_0800_bedrock-throttling.md`

## Investigation Methodology

### Phase 1: Initial Triage (5分以内)

1. **影響範囲の特定**
   - 影響を受けているエンドポイント/サービス
   - エラー発生頻度（単発 vs 継続）
   - 影響を受けているユーザー数/リクエスト数

2. **時間軸の確定**
   - 最初のエラー発生時刻
   - 直近のデプロイ/変更との相関

```bash
# 直近のエラー件数を確認
aws logs filter-log-events \
  --log-group-name "/aws/lambda/{function-name}" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern "ERROR" \
  --region ap-northeast-1
```

### Phase 2: Log Collection (CloudWatch Logs)

#### CloudWatch Logs Insights クエリ

**Lambda エラー分析**:
```sql
fields @timestamp, @message, @requestId
| filter @message like /ERROR|Exception|error/
| sort @timestamp desc
| limit 100
```

**API Gateway レイテンシ分析**:
```sql
fields @timestamp, integrationLatency, responseLatency, status
| filter status >= 400
| stats avg(integrationLatency), max(integrationLatency), count() by bin(5m)
```

**エラータイプ別集計**:
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| parse @message /(?<errorType>[A-Za-z]+Error)/
| stats count() by errorType
| sort count() desc
```

#### AWS CLI コマンド

```bash
# ログストリーム一覧
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/{function-name}" \
  --order-by LastEventTime \
  --descending \
  --limit 5

# 特定時間範囲のログ取得
aws logs filter-log-events \
  --log-group-name "/aws/lambda/{function-name}" \
  --start-time {epoch-ms} \
  --end-time {epoch-ms} \
  --filter-pattern "{pattern}"

# リアルタイムログ監視
aws logs tail "/aws/lambda/{function-name}" --follow
```

### Phase 3: Service-Specific Investigation

#### Lambda

| チェック項目 | コマンド/確認方法 |
|-------------|------------------|
| 関数設定 | `aws lambda get-function --function-name {name}` |
| 最新デプロイ | `LastModified` フィールド確認 |
| メモリ/タイムアウト | `MemorySize`, `Timeout` 確認 |
| 環境変数 | `Environment.Variables` 確認 |
| IAMロール | `Role` ARN → ポリシー確認 |
| コールドスタート | INIT_REPORT ログ確認 |
| 同時実行数 | `aws lambda get-function-concurrency` |

**Lambda固有のエラーパターン**:
```
Runtime.UserCodeSyntaxError  → コード構文エラー（ESMなど）
Task timed out              → タイムアウト設定不足
AccessDenied                → IAM権限不足
ENOMEM                      → メモリ不足
```

#### API Gateway

| チェック項目 | 確認方法 |
|-------------|---------|
| ステージ設定 | コンソール → Stages |
| CORS設定 | `aws apigatewayv2 get-api --api-id {id}` |
| 統合タイムアウト | Integration timeout (max 29s for HTTP API) |
| スロットリング | 429エラーの有無 |
| アクセスログ | CloudWatch Log Group 確認 |

#### Bedrock Agent

| チェック項目 | 確認方法 |
|-------------|---------|
| エージェント状態 | `aws bedrock-agent get-agent --agent-id {id}` |
| エイリアス状態 | `aws bedrock-agent get-agent-alias` |
| アクショングループ | OpenAPIスキーマとLambda実装の整合性 |
| IAM権限 | `bedrock:InvokeModel` 権限確認 |
| モデルアクセス | Bedrock コンソール → Model access |

### Phase 4: Cross-Service Correlation

#### X-Ray トレース（有効な場合）

```bash
# トレースサマリー取得
aws xray get-trace-summaries \
  --start-time {start} \
  --end-time {end} \
  --filter-expression 'service(id(name: "{service-name}")) AND responseTime > 1'
```

#### CloudTrail（API呼び出し履歴）

```bash
# 直近のAPI呼び出し確認
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=UpdateFunctionCode \
  --start-time {start-time}
```

### Phase 5: External Factors Check

1. **AWS Health Dashboard**: サービス障害の有無
2. **Service Quotas**: 制限への到達確認
3. **リージョン状態**: 特定リージョンの問題

```bash
# サービスクォータ確認
aws service-quotas get-service-quota \
  --service-code lambda \
  --quota-code L-B99A9384  # Concurrent executions
```

## Report Template

```markdown
# {Service} Investigation Report: {Issue Summary}

**Date**: YYYY-MM-DD HH:MM UTC
**Status**: 🔴 Active / 🟡 Mitigated / 🟢 Resolved
**Severity**: Critical / High / Medium / Low
**Affected Services**: {list}

## Summary

{1-2文で問題の概要}

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | 最初のエラー検出 |
| HH:MM | 調査開始 |
| HH:MM | 根本原因特定 |
| HH:MM | 修正適用 |

## Impact

- 影響を受けたリクエスト数: {N}
- エラー率: {X}%
- 影響時間: {duration}

## Root Cause Analysis

### 直接原因
{技術的な直接原因}

### 根本原因
{なぜこの問題が発生したか}

### 証拠
{ログ抜粋、スクリーンショット、メトリクス}

## Resolution

### 一時対応（Mitigation）
{即座に行った対応}

### 恒久対応（Fix）
{根本的な修正内容}

### 変更内容
{diff形式でのコード/設定変更}

## Lessons Learned

### What went well
- {良かった点}

### What could be improved
- {改善点}

## Action Items

- [ ] {後続タスク1}
- [ ] {後続タスク2}

## References

- CloudWatch Log Group: {ARN}
- Related PR: {URL}
- AWS Documentation: {URL}
```

## Severity Classification

| Severity | 基準 | 対応時間 |
|----------|------|---------|
| **Critical** | サービス完全停止、データ損失リスク | 即時対応 |
| **High** | 主要機能の障害、多数ユーザー影響 | 1時間以内 |
| **Medium** | 一部機能の障害、限定的影響 | 4時間以内 |
| **Low** | 軽微な問題、ユーザー影響なし | 24時間以内 |

## Common Error Patterns

### Lambda

| エラー | 原因 | 対処 |
|--------|------|------|
| `Runtime.UserCodeSyntaxError` | ESM/CJS不整合 | `package.json` に `"type": "module"` 追加 |
| `Task timed out` | 処理時間超過 | タイムアウト延長 or 処理最適化 |
| `ECONNREFUSED` | ネットワーク接続失敗 | VPC設定、セキュリティグループ確認 |
| `AccessDeniedException` | IAM権限不足 | ポリシー追加 |
| `ENOMEM` | メモリ不足 | メモリサイズ増加 |

### API Gateway

| エラー | 原因 | 対処 |
|--------|------|------|
| `403 Forbidden` | CORS、認証、WAF | CORS設定、認証トークン確認 |
| `429 Too Many Requests` | スロットリング | クォータ引き上げ、バックオフ実装 |
| `500 Internal Server Error` | Lambda実行エラー | Lambda ログ確認 |
| `504 Gateway Timeout` | 統合タイムアウト | タイムアウト設定確認（max 29s） |

### Bedrock

| エラー | 原因 | 対処 |
|--------|------|------|
| `AccessDeniedException` | モデルアクセス未許可 | Bedrock Model access 有効化 |
| `ThrottlingException` | レート制限 | リトライ with exponential backoff |
| `ValidationException` | 入力形式エラー | リクエスト形式確認 |

## Investigation Checklist

調査開始時に確認:

- [ ] 影響範囲を特定した
- [ ] 時間軸を確定した
- [ ] CloudWatch Logsを確認した
- [ ] 直近のデプロイ/変更を確認した
- [ ] IAM権限を確認した
- [ ] サービスクォータを確認した
- [ ] AWS Health Dashboardを確認した

調査完了時に確認:

- [ ] 根本原因を特定した
- [ ] 修正を適用した
- [ ] 修正の動作確認を行った
- [ ] 調査レポートを作成した
- [ ] 後続タスクを整理した
