# Bedrock InvokeAgent Investigation: Access Denied Error

**Date**: 2026-02-04 09:40 UTC (Updated: 09:50 UTC)
**Status**: 🟢 Resolved
**Severity**: High
**Affected Services**: Handler Lambda, Bedrock Agent

## Summary

Handler Lambda が Bedrock Agent を呼び出す際に `AccessDeniedException` エラーが発生。2つの IAM ポリシー問題が根本原因：
1. Handler Lambda: agent-alias ARN のワイルドカード使用
2. Bedrock Agent: Cross-region inference profile に必要な全宛先リージョンの foundation model アクセス権限不足

## Timeline

| Time (UTC) | Event |
|------------|-------|
| 09:10 | ESMモジュールエラー発生（別問題、デプロイ後解消） |
| 09:18 | Lambda再デプロイ後、正常起動確認 |
| 09:28 | 最初の AccessDeniedException 発生 |
| 09:31 | 複数回の AccessDeniedException 継続 |
| 09:40 | 調査開始、Handler IAM 修正 (agent-alias ARN) |
| 09:45 | エラー継続、Cross-region inference 権限問題を特定 |
| 09:50 | Cross-region model access 権限を追加、適用完了 |

## Impact

- 影響を受けたリクエスト数: 複数回のチャットリクエスト
- エラー率: 100%（全リクエスト失敗）
- 影響時間: 09:28 - 09:50 UTC

## Root Cause Analysis

### 原因1: Handler Lambda IAM (修正済み)

`bedrock:InvokeAgent` の Resource ARN にワイルドカード `/*` を使用していたが、特定のエイリアス ARN が必要。

### 原因2: Bedrock Agent IAM - Cross-Region Inference (修正済み)

APAC inference profile (`apac.amazon.nova-micro-v1:0`) を使用する場合、IAM ポリシーには全ての宛先リージョンの foundation model へのアクセスが必要。

**APAC の宛先リージョン**:
- ap-southeast-2 (Sydney)
- ap-northeast-1 (Tokyo)
- ap-south-1 (Mumbai)
- ap-northeast-2 (Seoul)
- ap-southeast-1 (Singapore)
- ap-northeast-3 (Osaka)

### 証拠

**CloudWatch Logs からのエラー抜粋**:
```json
{
  "level": 50,
  "event": "chat_error",
  "error": {
    "name": "AccessDeniedException",
    "$fault": "client"
  },
  "sessionId": "session-xxx"
}
```

## Resolution

### 修正1: Handler Lambda IAM

`app/iac/modules/strands-agents/iam.tf:34`:
```diff
- Resource = "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:agent-alias/${aws_bedrockagent_agent.main.agent_id}/*"
+ Resource = aws_bedrockagent_agent_alias.main.agent_alias_arn
```

### 修正2: Bedrock Agent IAM - Cross-Region Access

`app/iac/modules/strands-agents/locals.tf`:
```hcl
# Cross-region inference requires access to ALL destination regions
inference_profile_regions = {
  apac = ["ap-southeast-2", "ap-northeast-1", "ap-south-1", "ap-northeast-2", "ap-southeast-1", "ap-northeast-3"]
  us   = ["us-east-1", "us-east-2", "us-west-2"]
  eu   = ["eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3"]
}

cross_region_model_arns = [
  for region in local.inference_profile_regions[local.inference_profile_geography] :
  "arn:aws:bedrock:${region}::foundation-model/${local.base_model_id}"
]
```

`app/iac/modules/strands-agents/iam.tf`:
```hcl
{
  Sid    = "BedrockCrossRegionModelAccess"
  Effect = "Allow"
  Action = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
  Resource = local.cross_region_model_arns
  Condition = {
    StringEquals = {
      "bedrock:InferenceProfileArn" = local.foundation_model_arn
    }
  }
}
```

### 適用済み

```bash
terraform apply  # 2026-02-04 09:50 UTC に適用完了
```

## Lessons Learned

### What went well
- CloudWatch Logs で迅速にエラーを特定できた
- Terraform plan で変更内容を事前確認できた
- AWS ドキュメントで cross-region inference の要件を確認できた

### What could be improved
- Cross-region inference profile を使用する場合の IAM 要件を事前に確認すべきだった
- IAM ポリシーの ARN は手動構築ではなく、Terraform リソース参照を使用すべき

## Action Items

- [x] 根本原因特定 (Handler IAM)
- [x] Handler iam.tf の修正
- [x] Cross-region inference 権限問題の特定
- [x] Bedrock Agent IAM の修正
- [x] `terraform apply` で変更適用
- [ ] フロントエンドから動作確認

## References

- CloudWatch Log Group: `/aws/lambda/strands-agents-dev-handler`
- [AWS Bedrock Geographic Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/geographic-cross-region-inference.html)
- [AWS Bedrock InvokeAgent IAM Policy](https://docs.aws.amazon.com/bedrock/latest/userguide/security_iam_id-based-policy-examples-agent.html)
- Related files:
  - `app/iac/modules/strands-agents/iam.tf`
  - `app/iac/modules/strands-agents/locals.tf`
