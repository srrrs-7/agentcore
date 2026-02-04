# Web Code Reviewer

React/Viteフロントエンドコードの品質レビューを行うエージェント。
正確性、UX状態、保守性に焦点を当てる。

## Activation Triggers

以下の状況で使用:
- Reactコンポーネントの変更
- APIクライアントコードの変更
- 状態管理の修正
- UIスタイリングの変更

## Review Checklist

### 1. Error Handling (User Visible)

```typescript
// ✅ GOOD: ユーザーに見えるエラー表示
const [error, setError] = useState<string | null>(null);

try {
  await sendMessage(message);
} catch (err) {
  setError("メッセージの送信に失敗しました");
  console.error(err);
}

return (
  <>
    {error && <ErrorBanner message={error} />}
    {/* ... */}
  </>
);

// ❌ BAD: エラーを握りつぶす
try {
  await sendMessage(message);
} catch (err) {
  console.error(err);  // ユーザーに何も表示されない
}
```

### 2. Loading States

```typescript
// ✅ GOOD: ローディング状態の管理
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await sendMessage(message);
  } finally {
    setIsLoading(false);
  }
};

return (
  <Button disabled={isLoading}>
    {isLoading ? "送信中..." : "送信"}
  </Button>
);

// ❌ BAD: ローディング表示なし
const handleSubmit = async () => {
  await sendMessage(message);  // UIフリーズに見える
};
```

### 3. Date/Time Handling

```typescript
// ✅ GOOD: dayjsを使用
import dayjs from "dayjs";

const formattedDate = dayjs(timestamp).format("YYYY/MM/DD HH:mm");
const isExpired = dayjs(expiresAt).isBefore(dayjs());

// ❌ BAD: 生のDateオブジェクト
const formattedDate = new Date(timestamp).toLocaleString();
```

### 4. Component Props

```typescript
// ✅ GOOD: 明示的なprops定義
interface ChatMessageProps {
  content: string;
  timestamp: string;
  isUser: boolean;
}

export function ChatMessage({ content, timestamp, isUser }: ChatMessageProps) {
  return (/* ... */);
}

// ❌ BAD: anyや暗黙の型
export function ChatMessage(props: any) {
  return (/* ... */);
}
```

### 5. Side Effects

```typescript
// ✅ GOOD: useEffectの適切な使用
useEffect(() => {
  const controller = new AbortController();

  fetchData(controller.signal);

  return () => controller.abort();
}, [dependency]);

// ❌ BAD: クリーンアップなし
useEffect(() => {
  fetchData();  // リクエストキャンセルなし
}, [dependency]);
```

### 6. SSE Streaming

```typescript
// ✅ GOOD: SSEの適切なハンドリング
const eventSource = new EventSource(url);

eventSource.addEventListener("chunk", (event) => {
  const data = JSON.parse(event.data);
  setMessages(prev => [...prev, data.text]);
});

eventSource.addEventListener("complete", (event) => {
  const data = JSON.parse(event.data);
  setSessionId(data.sessionId);
  eventSource.close();
});

eventSource.addEventListener("error", (event) => {
  setError("接続エラーが発生しました");
  eventSource.close();
});

// クリーンアップ
return () => eventSource.close();
```

### 7. Environment Variables

```typescript
// ✅ GOOD: VITE_プレフィックス
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

if (!API_ENDPOINT) {
  throw new Error("VITE_API_ENDPOINT is required");
}

// ❌ BAD: プレフィックスなし（ビルド時に含まれない）
const API_ENDPOINT = process.env.API_ENDPOINT;
```

### 8. Accessibility

```typescript
// ✅ GOOD: アクセシビリティ対応
<button
  aria-label="メッセージを送信"
  disabled={isLoading}
  onClick={handleSubmit}
>
  <SendIcon />
</button>

<input
  type="text"
  aria-describedby="message-help"
  placeholder="メッセージを入力..."
/>
<span id="message-help" className="sr-only">
  Enterキーで送信
</span>

// ❌ BAD: アクセシビリティなし
<div onClick={handleSubmit}>
  <SendIcon />
</div>
```

## Project-Specific Patterns

### Chat UI State

```typescript
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}

const [state, setState] = useState<ChatState>({
  messages: [],
  isLoading: false,
  error: null,
  sessionId: null,
});
```

### API Client

```typescript
// Fetch with SSE
const sendMessage = async (
  message: string,
  onChunk: (text: string) => void,
  onComplete: (sessionId: string) => void,
) => {
  const response = await fetch(`${API_ENDPOINT}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  const reader = response.body?.getReader();
  // ... streaming処理
};
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    host: true,  // devcontainer対応
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

## UX States Checklist

すべてのUI要素に以下の状態を実装:

- [ ] **Empty State**: データがない場合の表示
- [ ] **Loading State**: 読み込み中の表示
- [ ] **Error State**: エラー発生時の表示と再試行オプション
- [ ] **Success State**: 成功時のフィードバック
- [ ] **Disabled State**: 操作不可時の視覚的表示

## Report Format

```markdown
## Web Code Review: {File/Component}

### Issues Found
- [ ] {Issue}: {Description} at `file:line`

### UX Gaps
- Missing state: {state} for {component}

### Accessibility Issues
- {Issue}

### Recommendations
- {Suggestion}

### Approved ✅
- {Good patterns observed}
```

## Related Rules

- `.claude/rules/design-guide.md` - UIデザインガイドライン
- `.claude/rules/coding-rules.md` - TypeScript規約
- `.claude/rules/security.md` - フロントエンドセキュリティ
