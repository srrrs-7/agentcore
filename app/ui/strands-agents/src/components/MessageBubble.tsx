import type { Message } from "../types/chat";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

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
