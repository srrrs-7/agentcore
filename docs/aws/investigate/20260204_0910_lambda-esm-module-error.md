# Lambda 500 Error Investigation Report

**Date**: 2026-02-04
**Endpoint**: https://5zqf26fupk.execute-api.ap-northeast-1.amazonaws.com/chat
**Status**: ✅ RESOLVED

## Summary

Lambda関数の初期化時にESM (ECMAScript Modules) の読み込みエラーが発生していた。

## Error Details

```
SyntaxError: Cannot use import statement outside a module
```

```
Failed to load the ES module: /var/task/index.js.
Make sure to set "type": "module" in the nearest package.json file or use the .mjs extension.
```

## Root Cause Analysis

### 問題の構造

| 項目 | 現状 | 期待値 |
|------|------|--------|
| ビルド出力 | `dist/index.js` (ESM形式) | ESMとして認識される |
| Lambda handler | `index.handler` | `index.js`を探す |
| Node.jsランタイム | `.js`をCommonJSとして解釈 | ESMとして解釈すべき |

### 原因

1. Bunのビルドコマンド (`--format=esm`) がESM形式のコードを出力
2. 出力ファイルは `index.js` (拡張子は`.js`)
3. Node.js 24.xランタイムは `.js` ファイルをデフォルトでCommonJSとして解釈
4. ESMの `import` 文がCommonJS環境で実行されエラー

## CloudWatch Logs Evidence

**Log Group**: `/aws/lambda/strands-agents-dev-handler`
**Timestamp**: 2026-02-04T09:10:14.263Z

```
INIT_START Runtime Version: nodejs:24.v29
ERROR: Init Error - Runtime.UserCodeSyntaxError
  SyntaxError: Cannot use import statement outside a module
  at /var/task/index.js:1
  import { createRequire } from "node:module";
  ^^^^^^
INIT_REPORT Init Duration: 162.16 ms  Phase: init  Status: error
```

## Solution Applied

ビルドスクリプトで `dist/package.json` を自動生成し、`"type": "module"` を指定。

### Changes Made

**1. Handler Lambda build script** (`app/api/strands-agents-handler/package.json`):
```diff
- "build": "bun build src/index.ts --outdir=dist --target=node --format=esm --external '@aws-sdk/*'"
+ "build": "bun build src/index.ts --outdir=dist --target=node --format=esm --external '@aws-sdk/*' && echo '{\"type\":\"module\"}' > dist/package.json"
```

**2. Actions Lambda build script** (`app/api/strands-agents-actions/package.json`):
```diff
- "build": "bun build src/index.ts --outdir=dist --target=node --format=esm"
+ "build": "bun build src/index.ts --outdir=dist --target=node --format=esm && echo '{\"type\":\"module\"}' > dist/package.json"
```

### Deployment Status

| Lambda | Status | Last Modified |
|--------|--------|---------------|
| strands-agents-dev-handler | ✅ Updated | 2026-02-04T09:14:20.000+0000 |
| strands-agents-dev-actions | ✅ Updated | 2026-02-04T09:14:27.000+0000 |

## Verification

Test the endpoint:
```bash
curl -X POST https://5zqf26fupk.execute-api.ap-northeast-1.amazonaws.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## Lessons Learned

- Bun ESMビルドをAWS Lambdaにデプロイする際は `package.json` に `"type": "module"` が必要
- Node.js 24.xでも `.js` 拡張子はデフォルトでCommonJSとして扱われる
- ESMを使う場合は `.mjs` 拡張子 または `"type": "module"` のいずれかが必須
