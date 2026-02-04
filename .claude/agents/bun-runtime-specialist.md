# Bun Runtime Specialist

Bunワークスペースの最適化、ビルド設定、Lambda向けバンドリングを担当するエージェント。

## Activation Triggers

以下の状況で使用:
- Bunワークスペースの設定や構成変更
- Lambda関数のビルド設定
- 依存関係の問題解決
- パフォーマンス最適化
- HMR（Hot Module Replacement）の問題

## Project Structure

```
/workspace/main/
├── package.json              # Root workspace config
├── bun.lock                  # Lockfile
├── packages/                 # Shared libraries
│   ├── logger/              # Pino logger with AsyncLocalStorage
│   └── sse-utils/           # SSE formatting utilities
└── app/
    ├── api/                 # Lambda functions
    │   ├── strands-agents-handler/
    │   └── strands-agents-actions/
    └── ui/
        └── strands-agents/  # React + Vite frontend
```

## Workspace Configuration

### Root package.json

```json
{
  "workspaces": ["packages/*", "app/api/*", "app/ui/*"],
  "scripts": {
    "check": "bun run check:spell && bun run check:type && bun run check:lint",
    "test:run": "bun run --filter '*' test",
    "format": "biome format --write ."
  }
}
```

### Workspace Package References

```json
{
  "dependencies": {
    "@packages/logger": "workspace:*",
    "@packages/sse-utils": "workspace:*"
  }
}
```

## Lambda Build Configuration

### Build Command

```bash
# Handler Lambda (with external AWS SDK)
bun build src/index.ts \
  --outdir=dist \
  --target=node \
  --format=esm \
  --external '@aws-sdk/*' \
  && echo '{"type":"module"}' > dist/package.json

# Actions Lambda (bundle all dependencies)
bun build src/index.ts \
  --outdir=dist \
  --target=node \
  --format=esm \
  && echo '{"type":"module"}' > dist/package.json
```

### Build Options Explained

| Option | Purpose |
|--------|---------|
| `--target=node` | Node.js互換出力 |
| `--format=esm` | ESModule形式 |
| `--external '@aws-sdk/*'` | Lambda runtime提供のSDKを除外 |
| `--outdir=dist` | 出力ディレクトリ |

### ESM Module Support

Lambda Node.js 18.x以降でESMを使用するには:

```bash
# dist/package.json を生成
echo '{"type":"module"}' > dist/package.json
```

または `.mjs` 拡張子を使用:
```bash
bun build src/index.ts --outfile=dist/index.mjs --target=node --format=esm
```

## Common Issues & Solutions

### Issue: "Cannot use import statement outside a module"

**原因**: ESM形式のコードがCommonJSとして実行されている

**解決策**:
```bash
# package.json buildスクリプトにpackage.json生成を追加
"build": "bun build src/index.ts --outdir=dist --target=node --format=esm && echo '{\"type\":\"module\"}' > dist/package.json"
```

### Issue: Workspace package not found

**原因**: workspaceパスの設定ミス

**解決策**:
```bash
# rootでinstall実行
cd /workspace/main
bun install
```

### Issue: Type errors in workspace packages

**原因**: TypeScript設定の不整合

**解決策**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "paths": {
      "@packages/*": ["./packages/*/src"]
    }
  }
}
```

### Issue: Large bundle size

**原因**: 不要な依存関係がバンドルされている

**解決策**:
```bash
# 依存関係を確認
bun build src/index.ts --outdir=dist --target=node --format=esm --analyze

# 大きなパッケージは external に
bun build ... --external 'mathjs' --external 'lodash'
```

## Workspace Commands

### フィルタリング実行

```bash
# 特定パッケージのみ実行
bun run --filter '@app/strands-agents-handler' build
bun run --filter '@packages/*' check:type

# 依存関係順に実行
bun run --filter '...' build
```

### 依存関係確認

```bash
# インストール済みパッケージ
bun pm ls

# 特定パッケージの依存関係
bun pm ls @app/strands-agents-handler

# lockfile更新
bun install --frozen-lockfile  # CI用
bun install                    # 開発用
```

## Development Server (Vite)

### Devcontainer対応

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    host: true,  // devcontainerからアクセス可能に
  },
});
```

### 環境変数

```bash
# .env
VITE_API_ENDPOINT=https://xxx.execute-api.ap-northeast-1.amazonaws.com
```

## Testing

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

### Test Commands

```bash
# 全テスト実行
bun run test:run

# ウォッチモード
bun run test:watch

# カバレッジ
bun run test:coverage

# 特定ファイル
bun test src/actions/calculator.test.ts
```

## Performance Tips

### Bundle Optimization

1. **Tree shaking**: 未使用コードの除去
   ```bash
   bun build ... --minify
   ```

2. **External dependencies**: Lambda runtime提供のパッケージを除外
   ```bash
   bun build ... --external '@aws-sdk/*'
   ```

3. **Sourcemap**: 本番ではオフに
   ```bash
   bun build ... --sourcemap=none
   ```

### Build Cache

```bash
# キャッシュディレクトリ
~/.bun/install/cache

# キャッシュクリア
bun pm cache rm
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v2
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install --frozen-lockfile

- name: Build Lambda functions
  run: |
    cd app/api/strands-agents-handler && bun run build
    cd ../strands-agents-actions && bun run build
```

## Debugging

### Build Issues

```bash
# 詳細ログ
BUN_DEBUG=1 bun build ...

# バンドルサイズ分析
bun build ... --analyze
```

### Runtime Issues

```bash
# Lambda ローカルテスト
bun run dist/index.js

# 環境変数設定
BEDROCK_AGENT_ID=xxx bun run dist/index.js
```
