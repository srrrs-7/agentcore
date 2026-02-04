import { useCallback, useEffect, useRef, useState } from "react";
import { generateSessionId, sendChatMessage } from "../lib/api";
import type { Message } from "../types/chat";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

interface ChatInterfaceProps {
  apiEndpoint: string;
}

const createMessage = (
  role: Message["role"],
  content: string,
  overrides: Partial<Message> = {},
): Message => ({
  id: `${role}-${Date.now()}`,
  role,
  content,
  timestamp: new Date(),
  ...overrides,
});

const updateMessageById = (
  messages: Message[],
  messageId: string,
  updater: (message: Message) => Message,
): Message[] =>
  messages.map((message) =>
    message.id === messageId ? updater(message) : message,
  );

export function ChatInterface({ apiEndpoint }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isLoading) return;

      // Add user message
      const userMessage = createMessage("user", trimmedContent);

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create placeholder for assistant message
      const assistantMessage = createMessage("assistant", "", {
        isStreaming: true,
      });
      const assistantMessageId = assistantMessage.id;

      setMessages((prev) => [...prev, assistantMessage]);

      const appendChunk = (text: string) => {
        setMessages((prev) =>
          updateMessageById(prev, assistantMessageId, (message) => ({
            ...message,
            content: message.content + text,
          })),
        );
      };

      const finalizeMessage = () => {
        setMessages((prev) =>
          updateMessageById(prev, assistantMessageId, (message) => ({
            ...message,
            isStreaming: false,
          })),
        );
      };

      const setErrorMessage = (errorText: string) => {
        setMessages((prev) =>
          updateMessageById(prev, assistantMessageId, (message) => ({
            ...message,
            content: `Error: ${errorText}`,
            isStreaming: false,
          })),
        );
      };

      try {
        await sendChatMessage(apiEndpoint, trimmedContent, sessionId, {
          onChunk: (data) => appendChunk(data.text),
          onComplete: finalizeMessage,
          onError: (data) => setErrorMessage(data.message),
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setErrorMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, sessionId, isLoading],
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Strands Agents Chat
          </h1>
          <p className="text-sm text-gray-500">
            Session: {sessionId.slice(0, 20)}...
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearChat}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Clear Chat
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-medium mb-2">Start a conversation</h2>
            <p className="text-sm text-center max-w-md">
              Ask me anything! I can help with calculations, tell you the time
              in different timezones, or search the web for information.
            </p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </footer>
    </div>
  );
}
