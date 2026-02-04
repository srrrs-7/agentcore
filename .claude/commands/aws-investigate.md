# /aws-investigate Command

AWS障害の調査を行い、調査レポートを `docs/aws/investigate/` に出力する。

## Required Context (MUST read)

- /workspace/main/.claude/rules/aws-investigation.md
- /workspace/main/.claude/agents/aws-log-investigator.md

## What This Command Does

- CloudWatch Logsからエラーログを取得・分析
- 根本原因を特定
- 調査レポートを `docs/aws/investigate/{YYYYMMDD}_{HHMM}_{title}.md` に出力

## Best Practices (from rules)

- `.claude/rules/aws-investigation.md` の調査手順に従う
- CloudWatch Logs Insights クエリを活用
- 最小限の影響範囲で一時対応を優先

## Inputs

- `$ARGUMENTS`: 調査対象（例: `lambda 500`, `api-gateway cors`, `bedrock timeout`）
  - 省略時: 直近1時間の全エラーを調査

## Prerequisites

- AWS CLI が設定されていること
- 対象リージョン: `ap-northeast-1`

## Execution Steps

### Phase 1: Triage (影響範囲特定)

1. ロググループ一覧を確認:
   ```bash
   aws logs describe-log-groups \
     --log-group-name-prefix "/aws/lambda/strands-agents" \
     --region ap-northeast-1
   ```

2. 直近のエラー件数を確認:
   ```bash
   aws logs filter-log-events \
     --log-group-name "/aws/lambda/strands-agents-dev-handler" \
     --start-time $(($(date +%s) * 1000 - 3600000)) \
     --filter-pattern "ERROR" \
     --region ap-northeast-1
   ```

### Phase 2: Log Collection (ログ収集)

3. エラーログの詳細取得:
   ```bash
   aws logs filter-log-events \
     --log-group-name "{log-group}" \
     --start-time {start-epoch-ms} \
     --end-time {end-epoch-ms} \
     --filter-pattern "{pattern}" \
     --region ap-northeast-1
   ```

4. 関連するLambda設定を確認:
   ```bash
   aws lambda get-function \
     --function-name strands-agents-dev-handler \
     --region ap-northeast-1
   ```

### Phase 3: Analysis (分析)

5. エラーパターンを分類:
   - `Runtime.UserCodeSyntaxError` → コード/ビルド問題
   - `Task timed out` → タイムアウト設定
   - `AccessDeniedException` → IAM権限
   - `ECONNREFUSED` → ネットワーク

6. 直近のデプロイ/変更との相関を確認

### Phase 4: Documentation (レポート作成)

7. 調査レポートを作成:
   - ファイル名: `docs/aws/investigate/{YYYYMMDD}_{HHMM}_{title}.md`
   - テンプレート: `.claude/rules/aws-investigation.md` の Report Template に従う

## Output

調査レポート: `docs/aws/investigate/{YYYYMMDD}_{HHMM}_{title}.md`

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

## Root Cause
{根本原因}

## Evidence
{ログ抜粋}

## Resolution
{修正内容}

## Lessons Learned
{教訓}

## Action Items
- [ ] {後続タスク}
```

## Verification

- 調査レポートが作成されていること
- 根本原因が特定されていること
- 修正適用後にエラーが解消されていること

## Project-Specific Log Groups

| Service | Log Group |
|---------|-----------|
| Handler Lambda | `/aws/lambda/strands-agents-dev-handler` |
| Actions Lambda | `/aws/lambda/strands-agents-dev-actions` |
| API Gateway | `/aws/apigateway/strands-agents-dev` |
