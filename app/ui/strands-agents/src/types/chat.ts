export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface SSEChunkEvent {
  text: string;
  chunkIndex: number;
}

export interface SSECompleteEvent {
  sessionId: string;
  totalChunks: number;
}

export interface SSEErrorEvent {
  message: string;
  code?: string;
}
