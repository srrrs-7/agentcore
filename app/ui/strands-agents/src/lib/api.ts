import type {
  SSEChunkEvent,
  SSECompleteEvent,
  SSEErrorEvent,
} from "../types/chat";

interface SendMessageCallbacks {
  onChunk: (data: SSEChunkEvent) => void;
  onComplete: (data: SSECompleteEvent) => void;
  onError: (data: SSEErrorEvent) => void;
}

export interface EmbeddingResponse {
  modelId: string;
  embedding: number[];
  inputTextTokenCount?: number;
}

const parseSseEvent = (
  eventBlock: string,
): {
  type: string;
  data: string;
} | null => {
  if (!eventBlock.trim()) return null;

  const lines = eventBlock.split("\n");
  let eventType = "";
  let eventData = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      eventType = line.slice(7);
    } else if (line.startsWith("data: ")) {
      eventData = line.slice(6);
    }
  }

  if (!eventData) return null;
  return { type: eventType, data: eventData };
};

const handleSseBuffer = (
  buffer: string,
  callbacks: SendMessageCallbacks,
): string => {
  const events = buffer.split("\n\n");
  const remaining = events.pop() || "";

  for (const eventBlock of events) {
    const parsed = parseSseEvent(eventBlock);
    if (!parsed) continue;

    try {
      const data = JSON.parse(parsed.data);
      switch (parsed.type) {
        case "chunk":
          callbacks.onChunk(data as SSEChunkEvent);
          break;
        case "complete":
          callbacks.onComplete(data as SSECompleteEvent);
          break;
        case "error":
          callbacks.onError(data as SSEErrorEvent);
          break;
      }
    } catch {
      console.warn("Failed to parse SSE data:", parsed.data);
    }
  }

  return remaining;
};

/**
 * Send a chat message and handle SSE streaming response
 */
export async function sendChatMessage(
  apiEndpoint: string,
  message: string,
  sessionId: string,
  agentAliasId: string | undefined,
  callbacks: SendMessageCallbacks,
): Promise<void> {
  const response = await fetch(`${apiEndpoint}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sessionId,
      agentAliasId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events in buffer
      buffer = handleSseBuffer(buffer, callbacks);
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Request a text embedding from the API
 */
export async function getTextEmbedding(
  apiEndpoint: string,
  text: string,
  modelId?: string,
): Promise<EmbeddingResponse> {
  const response = await fetch(`${apiEndpoint}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, modelId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as EmbeddingResponse;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `session-${crypto.randomUUID()}`;
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
