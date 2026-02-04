/**
 * SSE (Server-Sent Events) utilities for streaming responses
 */

export interface SSEEvent {
  /** Event type name */
  event?: string;
  /** Event data (will be JSON stringified) */
  data: unknown;
  /** Optional event ID for reconnection support */
  id?: string;
}

/**
 * Format an event object into SSE format string
 * @param event - The event to format
 * @returns SSE formatted string
 */
export const formatSSE = (event: SSEEvent): string => {
  const lines: string[] = [];

  if (event.id) {
    lines.push(`id: ${event.id}`);
  }

  if (event.event) {
    lines.push(`event: ${event.event}`);
  }

  lines.push(`data: ${JSON.stringify(event.data)}`);
  lines.push(""); // Required blank line after data

  return `${lines.join("\n")}\n`;
};

/**
 * SSE event type constants
 */
export const SSEEventType = {
  /** Text chunk from streaming response */
  CHUNK: "chunk",
  /** Stream completed successfully */
  COMPLETE: "complete",
  /** Error occurred during streaming */
  ERROR: "error",
  /** Keep-alive heartbeat */
  HEARTBEAT: "heartbeat",
} as const;

export type SSEEventTypeValue =
  (typeof SSEEventType)[keyof typeof SSEEventType];

/**
 * Chunk event data structure
 */
export interface ChunkEventData {
  text: string;
  chunkIndex: number;
}

/**
 * Complete event data structure
 */
export interface CompleteEventData {
  sessionId: string;
  totalChunks: number;
}

/**
 * Error event data structure
 */
export interface ErrorEventData {
  message: string;
  code?: string;
}

/**
 * Parse SSE formatted string into events
 * @param sseString - Raw SSE string from stream
 * @returns Parsed event or null if incomplete
 */
export const parseSSE = (sseString: string): SSEEvent | null => {
  const lines = sseString.trim().split("\n");
  const event: Partial<SSEEvent> = {};

  for (const line of lines) {
    if (line.startsWith("id: ")) {
      event.id = line.slice(4);
    } else if (line.startsWith("event: ")) {
      event.event = line.slice(7);
    } else if (line.startsWith("data: ")) {
      try {
        event.data = JSON.parse(line.slice(6));
      } catch {
        event.data = line.slice(6);
      }
    }
  }

  if (event.data === undefined) {
    return null;
  }

  return event as SSEEvent;
};
