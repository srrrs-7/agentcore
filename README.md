# Vuln Scanner

Slackから脆弱性調査リクエストを受け付け、AWS Bedrock Agentsを活用して自動調査を行うシステム。

## システム構成

```
Slack → Lambda (Function URL) → Bedrock Agent (Claude 3 Haiku) → NVD/OSV API
```

月額コスト: 約$5（100リクエスト/日想定）

## 1. 開発環境構築

### 前提条件

- Docker Desktop
- VS Code + Dev Containers拡張機能

### セットアップ手順

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/srrrs-7/agentcore.git
   cd agentcore
   ```

2. **VS Codeで開く**
   ```bash
   code .
   ```

3. **Dev Containerを起動**
   - コマンドパレット (`Cmd+Shift+P`) → `Dev Containers: Reopen in Container`
   - 初回は数分かかります（Bun, Terraform, AWS CLI等がインストールされます）

4. **依存関係の確認**
   ```bash
   bun install  # 通常はpostCreateCommandで実行済み
   ```

### Dev Container内のツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Bun | 1.3.5 | パッケージマネージャ・ランタイム |
| Node.js | 24 | Lambda互換確認用 |
| Terraform | latest | インフラ管理 |
| AWS CLI | latest | AWS操作 |
| Claude Code | latest | AI開発支援 |

### 開発コマンド

```bash
# チェック（lint + type check + spell check）
bun run check

# テスト実行
bun run test:run

# フォーマット
bun run format

# Lambda関数のビルド
cd app/func/vuln-scanner && bun run build
cd app/func/vuln-scanner-actions && bun run build
```

## 2. クラウド環境構築

### 前提条件

- AWSアカウント
- Slack Workspace管理者権限
- GitHub Actions用のOIDC設定済み

### Step 1: Slack Appの作成

1. [Slack API](https://api.slack.com/apps)で新規App作成

2. **OAuth & Permissions**でBot Token Scopesを設定:
   - `commands`
   - `chat:write`
   - `chat:write.public`

3. **Slash Commands**で `/vuln` コマンドを作成（URLは後で設定）

4. 以下を控えておく:
   - **Signing Secret** (Basic Information)
   - **Bot User OAuth Token** (OAuth & Permissions)

### Step 2: AWS Parameter Storeにシークレット登録

```bash
# Slack Signing Secret
aws ssm put-parameter \
  --name "/vuln-scanner/slack-signing-secret" \
  --type "SecureString" \
  --value "<YOUR_SIGNING_SECRET>"

# Slack Bot Token
aws ssm put-parameter \
  --name "/vuln-scanner/slack-bot-token" \
  --type "SecureString" \
  --value "<YOUR_BOT_TOKEN>"
```

### Step 3: Terraformでインフラ構築

```bash
cd app/iac/environments/dev

# tfvarsファイルを作成
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvarsを編集してシークレットを設定

# 初期化
terraform init

# プラン確認
terraform plan

# 適用
terraform apply
```

### Step 4: Slack AppにFunction URLを設定

1. Terraform出力からLambda Function URLを取得:
   ```bash
   terraform output lambda_function_url
   ```

2. Slack Appの設定を更新:
   - **Slash Commands** → `/vuln` → Request URL に上記URLを設定
   - **Interactivity & Shortcuts** → Request URL に上記URLを設定

3. Slack Appをワークスペースにインストール

## 3. 開発フロー

### ローカル開発

```bash
# 1. コード変更

# 2. チェック実行
bun run check

# 3. テスト実行
bun run test:run

# 4. ビルド確認
cd app/func/vuln-scanner && bun run build
```

### デプロイ

**自動デプロイ（推奨）:**
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
# → GitHub Actionsが自動でCI/CDを実行
```

**手動デプロイ:**
```bash
# Lambda関数のビルド
cd app/func/vuln-scanner && bun run build
cd ../vuln-scanner-actions && bun run build

# デプロイ
aws lambda update-function-code \
  --function-name vuln-scanner-dev-handler \
  --zip-file fileb://app/func/vuln-scanner/dist/handler.zip

aws lambda update-function-code \
  --function-name vuln-scanner-dev-actions \
  --zip-file fileb://app/func/vuln-scanner-actions/dist/actions.zip
```

### Terraformの変更

```bash
cd app/iac/environments/dev

# 変更確認
terraform plan

# 適用
terraform apply
```

## 4. 使用方法

Slackで以下のコマンドを実行:

```
/vuln CVE-2024-1234        # CVE IDで検索
/vuln lodash               # パッケージ名で検索
/vuln @types/node          # スコープ付きパッケージも対応
```

## ディレクトリ構成

```
.
├── app/
│   ├── func/                    # Lambda関数
│   │   ├── vuln-scanner/        # Slackイベントハンドラ
│   │   └── vuln-scanner-actions/# Bedrock Agent Action Groups
│   └── iac/                     # Terraform
│       ├── modules/vuln-scanner/
│       └── environments/dev/
├── packages/
│   └── logger/                  # 共有ロガー
└── docs/
    └── system-arch/             # アーキテクチャドキュメント
```

## 関連ドキュメント

- [アーキテクチャ設計書](docs/system-arch/vulnerability-scanner.md)
