# Bedrock Investigation Report: Nova Micro Inference Profile Required

**Date**: 2026-02-04
**Status**: Identified (Fix Required)
**Severity**: High
**Affected Services**: Bedrock Agent, Lambda Handler

## Summary

Amazon Nova Micro モデル (`amazon.nova-micro-v1:0`) をon-demand throughputで直接呼び出すことができない。Cross-region inference profileの使用が必要。

## Error Message

```
Error: Invocation of model ID amazon.nova-micro-v1:0 with on-demand throughput isn't supported.
Retry your request with the ID or ARN of an inference profile that contains this model.
(Service: BedrockRuntime, Status Code: 400, Request ID: 8ccca143-eedf-43e0-b293-ae020376db02)
```

## Root Cause Analysis

### 直接原因

Bedrock Agentの `foundation_model` パラメータに直接モデルID (`amazon.nova-micro-v1:0`) を指定しているが、Amazon Novaモデルはon-demand throughputでの直接呼び出しをサポートしていない。

### 根本原因

AWSの仕様変更により、Amazon Novaモデル（Micro, Lite, Pro）はcross-region inference profileを通じてのみ呼び出せるようになった。これはAWSがリージョン間での負荷分散と可用性向上のために導入した仕組み。

### 証拠

現在の設定 (`app/iac/modules/strands-agents/variables.tf:17-21`):
```hcl
variable "foundation_model" {
  description = "Bedrock foundation model ID"
  type        = string
  default     = "amazon.nova-micro-v1:0"  # <- 直接モデルIDを使用
}
```

Bedrock Agent設定 (`app/iac/modules/strands-agents/bedrock.tf:6`):
```hcl
foundation_model = var.foundation_model  # <- そのまま使用
```

## Resolution

### 修正内容

`ap-northeast-1` (東京) リージョンを使用しているため、APAC inference profileを使用する。

**変更箇所**: `app/iac/modules/strands-agents/variables.tf`

```diff
variable "foundation_model" {
  description = "Bedrock foundation model ID (e.g., amazon.nova-micro-v1:0, anthropic.claude-3-haiku-20240307-v1:0)"
  type        = string
-  default     = "amazon.nova-micro-v1:0"
+  default     = "apac.amazon.nova-micro-v1:0"
}
```

### 利用可能なNova Inference Profile一覧

| リージョングループ | Inference Profile ID | 対象リージョン |
|-------------------|---------------------|---------------|
| US | `us.amazon.nova-micro-v1:0` | us-east-1, us-east-2, us-west-2 |
| APAC | `apac.amazon.nova-micro-v1:0` | ap-northeast-1, ap-southeast-1, etc. |
| EU | `eu.amazon.nova-micro-v1:0` | eu-central-1, eu-west-1, etc. |

### 適用手順

1. `variables.tf` のデフォルト値を更新
2. Terraform applyを実行
3. Bedrock Agentが再構成される

```bash
cd app/iac/environments/strands-agents
terraform plan
terraform apply
```

## Impact

- 影響: Bedrock Agentへのすべてのリクエストが失敗
- エラー率: 100%

## Alternative Solutions

### Option 1: APAC Inference Profile (推奨)
- `apac.amazon.nova-micro-v1:0` を使用
- 東京リージョンに最適
- コスト: 変更なし ($0.035/1M input tokens)

### Option 2: Claude 3 Haiku
- `anthropic.claude-3-haiku-20240307-v1:0` に変更
- Inference profile不要（直接呼び出し可能）
- コスト: やや高い ($0.25/1M input tokens)

## References

- [AWS Bedrock Inference Profiles Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)
- [Amazon Nova Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-nova.html)
- 関連ファイル: `app/iac/modules/strands-agents/variables.tf`
- 関連ファイル: `app/iac/modules/strands-agents/bedrock.tf`
