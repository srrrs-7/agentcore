# Bedrock Agent AccessDeniedException 完全解決レポート

**Date**: 2026-02-04 10:10 UTC
**Status**: 🟢 Resolved
**Severity**: High
**Duration**: 09:10 - 10:05 UTC (約55分)

## Executive Summary

Bedrock Agent を使用したチャットアプリケーションで `AccessDeniedException` エラーが発生。調査の結果、**3つの問題**が複合的に発生していたことが判明。最終的な根本原因は **Agent Alias が古いバージョンを参照していた**ことであり、複雑な IAM 設定変更は不要だった。

## 発生したエラー

```
Error: Access denied when calling Bedrock. Check your request permissions and retry the request.
```

```
Error: Invocation of model ID amazon.nova-micro-v1:0 with on-demand throughput isn't supported.
```

## タイムライン

| Time (UTC) | Event |
|------------|-------|
| 09:10 | ESM モジュールエラー発生（Lambda ビルド問題、別件） |
| 09:18 | Lambda 再デプロイ後、正常起動 |
| 09:28 | AccessDeniedException 発生開始 |
| 09:40 | 調査開始、Handler Lambda IAM の agent-alias ARN 修正 |
| 09:45 | エラー継続、Cross-region inference 権限問題を疑う |
| 09:50 | Cross-region IAM 権限を追加（後に不要と判明） |
| 09:58 | IAM 修正後もエラー継続、新たに "on-demand throughput" エラー |
| 10:02 | Agent Alias のバージョン問題を発見 |
| 10:03 | Agent Alias 再作成、Version 2 が作成される |
| 10:05 | 正常動作確認 |
| 10:10 | 不要な IAM 設定をクリーンアップ |

## 根本原因分析

### 問題の構造

```
┌─────────────────────────────────────────────────────────────────────┐
│                        問題の連鎖                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Handler Lambda                                                  │
│     └─→ bedrock:InvokeAgent                                        │
│         └─→ Agent Alias (VMSDAPNGNG)                               │
│             └─→ Version 1 ← ここが問題                              │
│                 └─→ foundation_model: "amazon.nova-micro-v1:0" ❌  │
│                                                                     │
│  本来あるべき状態:                                                   │
│     └─→ Version 2                                                   │
│         └─→ foundation_model: "apac.amazon.nova-micro-v1:0" ✅     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 発見された3つの問題

#### 問題1: Handler Lambda IAM の ARN 形式（軽微）

**現象**: `bedrock:InvokeAgent` の Resource にワイルドカードを使用

```hcl
# Before (問題あり)
Resource = "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:agent-alias/${aws_bedrockagent_agent.main.agent_id}/*"

# After (修正後)
Resource = aws_bedrockagent_agent_alias.main.agent_alias_arn
```

**影響**: 軽微。ワイルドカードでも動作する可能性があったが、ベストプラクティスに従い修正。

#### 問題2: Foundation Model ID の形式（重要）

**現象**: Amazon Nova モデルは直接モデル ID では on-demand throughput で使用不可

| モデル指定 | 有効性 | 説明 |
|-----------|--------|------|
| `amazon.nova-micro-v1:0` | ❌ | 直接モデル ID、on-demand 不可 |
| `apac.amazon.nova-micro-v1:0` | ✅ | Inference Profile ID |

**参考**: [AWS Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)

#### 問題3: Agent Alias のバージョン参照（根本原因）

**現象**: Alias が古いバージョンを参照し続けていた

```
Agent Alias "dev" (VMSDAPNGNG)
  └─→ routingConfiguration: agentVersion = "1"
      └─→ Version 1: foundationModel = "amazon.nova-micro-v1:0" ❌

Agent (DRAFT)
  └─→ foundationModel = "apac.amazon.nova-micro-v1:0" ✅
```

**原因**: Terraform で Agent の `foundation_model` を変更しても、既存の Alias は古いバージョンを参照し続ける。Alias を再作成しない限り、新しい設定は適用されない。

## 解決策

### 最終的な修正内容

#### 1. Handler Lambda IAM (`iam.tf:34`)

```hcl
{
  Sid    = "BedrockAgentInvoke"
  Effect = "Allow"
  Action = [
    "bedrock:InvokeAgent"
  ]
  Resource = aws_bedrockagent_agent_alias.main.agent_alias_arn  # 動的参照
}
```

#### 2. Foundation Model ARN 生成 (`locals.tf`)

```hcl
locals {
  # Inference profile かどうかを判定
  is_inference_profile = can(regex("^(apac|us|eu)\\.", var.foundation_model))

  # ARN 形式を動的に生成
  foundation_model_arn = local.is_inference_profile
    ? "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/${var.foundation_model}"
    : "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.foundation_model}"
}
```

#### 3. Agent Alias のライフサイクル管理 (`bedrock.tf`)

```hcl
resource "aws_bedrockagent_agent_alias" "main" {
  agent_id         = aws_bedrockagent_agent.main.agent_id
  agent_alias_name = var.environment

  # Agent 変更時に Alias を再作成
  lifecycle {
    replace_triggered_by = [aws_bedrockagent_agent.main]
  }
}
```

### 必要だった Cross-Region IAM 権限

Cross-region inference profile を使用する場合、全宛先リージョンの foundation model へのアクセス権限が**必要**:

```hcl
# locals.tf
cross_region_model_arns = [
  "arn:aws:bedrock:ap-southeast-2::foundation-model/amazon.nova-micro-v1:0",
  "arn:aws:bedrock:ap-northeast-1::foundation-model/amazon.nova-micro-v1:0",
  "arn:aws:bedrock:ap-south-1::foundation-model/amazon.nova-micro-v1:0",
  "arn:aws:bedrock:ap-northeast-2::foundation-model/amazon.nova-micro-v1:0",
  "arn:aws:bedrock:ap-southeast-1::foundation-model/amazon.nova-micro-v1:0",
  "arn:aws:bedrock:ap-northeast-3::foundation-model/amazon.nova-micro-v1:0",
]
```

### 不要だった変更

| 変更内容 | 不要だった理由 |
|---------|---------------|
| `bedrock:GetInferenceProfile` アクション | Bedrock Agent は内部で処理 |
| グローバル foundation model ARN | Geographic inference profile には不要 |
| IAM Condition ブロック | 不要な制約 |

## 教訓

### What Went Well

1. CloudWatch Logs で迅速にエラーパターンを特定
2. Terraform plan で変更内容を事前確認
3. 段階的なデバッグで問題を切り分け

### What Could Be Improved

1. **Agent Alias のバージョン管理を理解する**
   - Alias は作成時のバージョンを固定で参照
   - Agent 設定変更後は Alias の再作成が必要

2. **Nova モデルの制約を事前確認**
   - Amazon Nova は inference profile 必須
   - 直接モデル ID では on-demand 利用不可

3. **過剰な権限追加を避ける**
   - 問題の切り分け前に複雑な IAM 変更を行わない
   - 最小権限の原則に従い、段階的に権限を追加

### 推奨プラクティス

```hcl
# ✅ Agent Alias には必ず lifecycle を設定
resource "aws_bedrockagent_agent_alias" "main" {
  lifecycle {
    replace_triggered_by = [aws_bedrockagent_agent.main]
  }
}

# ✅ IAM Resource は Terraform リソース参照を使用
Resource = aws_bedrockagent_agent_alias.main.agent_alias_arn

# ✅ Nova モデルは inference profile ID を使用
foundation_model = "apac.amazon.nova-micro-v1:0"  # Not "amazon.nova-micro-v1:0"
```

## 影響を受けたファイル

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `app/iac/modules/strands-agents/iam.tf` | 修正 | Handler IAM の ARN 参照方式 |
| `app/iac/modules/strands-agents/locals.tf` | 修正 | Inference profile ARN 生成ロジック |
| `app/iac/modules/strands-agents/bedrock.tf` | 修正 | Alias lifecycle 追加 |

## 検証コマンド

```bash
# Agent の foundation model を確認
aws bedrock-agent get-agent --agent-id 47B4NMTPNQ --region ap-northeast-1 \
  | jq '{foundationModel: .agent.foundationModel}'

# Alias が参照するバージョンを確認
aws bedrock-agent get-agent-alias --agent-id 47B4NMTPNQ --agent-alias-id VY4NEN2ZFW --region ap-northeast-1 \
  | jq '{routingConfiguration: .agentAlias.routingConfiguration}'

# そのバージョンの foundation model を確認
aws bedrock-agent get-agent-version --agent-id 47B4NMTPNQ --agent-version 2 --region ap-northeast-1 \
  | jq '{foundationModel: .agentVersion.foundationModel}'
```

## 参考資料

- [Amazon Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)
- [Amazon Nova Model Requirements](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)
- [Bedrock Agent IAM Policies](https://docs.aws.amazon.com/bedrock/latest/userguide/security_iam_id-based-policy-examples-agent.html)
