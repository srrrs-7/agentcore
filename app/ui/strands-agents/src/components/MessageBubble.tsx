import type { Message } from "../types/chat";

interface MessageBubbleProps {
  message: Message;
}

const chunkAverage = (values: number[], bucketCount: number): number[] => {
  if (values.length === 0 || bucketCount <= 0) return [];
  const bucketSize = values.length / bucketCount;
  const buckets: number[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);
    if (start >= values.length) {
      buckets.push(0);
      continue;
    }
    const slice = values.slice(start, Math.max(end, start + 1));
    const sum = slice.reduce((acc, val) => acc + val, 0);
    buckets.push(sum / slice.length);
  }
  return buckets;
};

const normalizeValues = (values: number[]): number[] => {
  if (values.length === 0) return [];
  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (max === min) {
    return values.map(() => 0.5);
  }
  return values.map((value) => (value - min) / (max - min));
};

const buildFingerprint = (values: number[], size: number): number[] => {
  const totalCells = size * size;
  const buckets = chunkAverage(values, totalCells);
  return normalizeValues(buckets);
};

const buildSparklinePoints = (
  values: number[],
  width: number,
  height: number,
): string => {
  if (values.length === 0) return "";
  const normalized = normalizeValues(values);
  return normalized
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - value * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const getTopK = (values: number[], k: number) => {
  return values
    .map((value, index) => ({
      index,
      value,
      abs: Math.abs(value),
    }))
    .sort((a, b) => b.abs - a.abs)
    .slice(0, k);
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const embedding = message.embedding;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {embedding && !isUser && (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Embedding Wave
              </div>
              <svg
                className="w-full h-12"
                viewBox="0 0 240 48"
                preserveAspectRatio="none"
                role="img"
                aria-label="Embedding sparkline"
              >
                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  points={buildSparklinePoints(
                    chunkAverage(embedding.vector, 32),
                    240,
                    48,
                  )}
                />
              </svg>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Embedding Fingerprint
              </div>
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
              >
                {buildFingerprint(embedding.vector, 16).map((value, idx) => (
                  <div
                    key={`${message.id}-finger-${idx}`}
                    className="w-2 h-2 rounded-sm"
                    style={{
                      backgroundColor: `rgba(59,130,246,${(
                        0.2 +
                        value * 0.8
                      ).toFixed(2)})`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Top Features
              </div>
              <div className="space-y-1 text-xs text-gray-700">
                {getTopK(embedding.vector, 5).map((item) => (
                  <div key={`${message.id}-top-${item.index}`}>
                    #{item.index}: {item.value.toFixed(4)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {message.isStreaming && (
          <span className="inline-block ml-1 animate-pulse">▌</span>
        )}
        <div
          className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-gray-400"}`}
        >
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
