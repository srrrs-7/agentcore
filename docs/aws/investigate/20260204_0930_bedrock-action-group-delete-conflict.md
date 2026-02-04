# Bedrock Agent Investigation Report: Action Group Delete Conflict

**Date**: 2026-02-04 09:30 UTC
**Status**: 🟢 Resolved
**Severity**: Medium
**Affected Services**: Bedrock Agent, Terraform

## Summary

`terraform destroy` 実行時、Bedrock Agent の Action Groups が Enabled 状態のため削除に失敗。AWS CLI で Action Groups を DISABLED に変更後、正常に削除可能となった。

## Timeline

| Time (UTC) | Event |
|------------|-------|
| 09:10 | `terraform destroy` 実行、ConflictException 発生 |
| 09:15 | 調査開始、Action Group の状態確認 |
| 09:25 | AWS CLI で 3 つの Action Groups を DISABLED に変更 |
| 09:30 | 問題解決、`terraform destroy` 再実行可能 |

## Impact

- 影響を受けたリソース: 3 Action Groups (calculator, datetime, websearch)
- エラー率: 100% (destroy 操作が完全にブロック)
- 影響時間: 約 20 分

## Root Cause Analysis

### 直接原因

AWS Bedrock Agent の仕様により、`ENABLED` 状態の Action Group は削除できない。

```
ConflictException: ActionGroup with ID VNSMRYMENM cannot be deleted when it is Enabled.
```

### 根本原因

1. **Terraform Provider の制限**: `aws_bedrockagent_agent_action_group` リソースの destroy 時に自動的に DISABLED への状態変更を行わない
2. **AWS API の仕様**: DeleteAgentActionGroup API は ENABLED 状態の Action Group に対して 409 Conflict を返す

### 証拠

エラーログ:
```
│ Error: deleting Bedrock Agent Action Group (VNSMRYMENM,47B4NMTPNQ,DRAFT)
│
│ operation error Bedrock Agent: DeleteAgentActionGroup, https
│ response error StatusCode: 409, RequestID: 5adfb894-b7ba-4d0a-b997-274d46a343fb,
│ ConflictException: ActionGroup with ID VNSMRYMENM cannot be deleted when it is Enabled.
```

影響を受けた Action Groups:
| ID | Name | State (Before) |
|----|------|----------------|
| VNSMRYMENM | websearch | ENABLED |
| E87UQ3YRP6 | datetime | ENABLED |
| ECWZKJS85U | calculator | ENABLED |

## Resolution

### 一時対応（Mitigation）

AWS CLI を使用して各 Action Group を DISABLED 状態に変更:

```bash
# Action Group の現在のスキーマを取得
aws bedrock-agent get-agent-action-group \
  --agent-id {AGENT_ID} \
  --agent-version DRAFT \
  --action-group-id {ACTION_GROUP_ID} \
  --region ap-northeast-1 \
  --query 'agentActionGroup.apiSchema.payload' \
  --output text > /tmp/schema.json

# DISABLED に更新（apiSchema が必須）
SCHEMA=$(cat /tmp/schema.json)
cat << EOF > /tmp/disable-action-group.json
{
  "agentId": "{AGENT_ID}",
  "agentVersion": "DRAFT",
  "actionGroupId": "{ACTION_GROUP_ID}",
  "actionGroupName": "{ACTION_GROUP_NAME}",
  "actionGroupState": "DISABLED",
  "actionGroupExecutor": {
    "lambda": "{LAMBDA_ARN}"
  },
  "apiSchema": {
    "payload": $(echo "$SCHEMA" | sed 's/"/\\"/g' | sed 's/^/"/;s/$/"/')
  }
}
EOF

aws bedrock-agent update-agent-action-group \
  --cli-input-json file:///tmp/disable-action-group.json \
  --region ap-northeast-1
```

### 恒久対応（Recommendations）

1. **destroy 前の手順として文書化**: `terraform destroy` 前に Action Groups を無効化するスクリプトを用意
2. **Terraform の lifecycle 設定検討**: `create_before_destroy` や null_resource での pre-destroy hook を検討
3. **AWS Provider の Issue 確認**: 将来的に Provider 側で対応される可能性あり

## Lessons Learned

### What went well
- エラーメッセージから原因を迅速に特定できた
- AWS CLI での回避策をすぐに実行できた

### What could be improved
- Bedrock Agent の削除手順を事前に文書化しておくべきだった
- Terraform の destroy 時の振る舞いを事前検証すべきだった

## Action Items

- [x] Action Groups を DISABLED に変更
- [ ] `terraform destroy` を再実行して完了確認
- [x] CLAUDE.md に Bedrock Agent 削除手順を追記
- [ ] 削除用スクリプトの作成を検討

## References

- Agent ID: `47B4NMTPNQ`
- Region: `ap-northeast-1`
- AWS Documentation: [DeleteAgentActionGroup API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_DeleteAgentActionGroup.html)
