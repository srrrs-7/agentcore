import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateSessionId,
  getTextEmbedding,
  sendChatMessage,
} from "../lib/api";
import type { Message } from "../types/chat";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

interface ChatInterfaceProps {
  apiEndpoint: string;
}

const EMBEDDING_MODELS_RAW = import.meta.env.VITE_EMBEDDING_MODEL_OPTIONS;
const DEFAULT_EMBEDDING_MODELS = (() => {
  if (
    typeof EMBEDDING_MODELS_RAW !== "string" ||
    EMBEDDING_MODELS_RAW.trim().length === 0
  ) {
    return ["amazon.titan-embed-text-v2:0"];
  }
  const models = EMBEDDING_MODELS_RAW.split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return models.length > 0 ? models : ["amazon.titan-embed-text-v2:0"];
})();

const DEFAULT_AGENT_ALIASES = (() => {
  const raw = import.meta.env.VITE_AGENT_ALIAS_OPTIONS;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return [];
  }
  const models = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return models;
})();

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

const resolveOption = (value: string, options: string[]) =>
  options.includes(value) ? value : options[0];

export function ChatInterface({ apiEndpoint }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const [embeddingModelId, setEmbeddingModelId] = useState(
    () => DEFAULT_EMBEDDING_MODELS[0],
  );
  const isEmbeddingModelConfigured =
    typeof EMBEDDING_MODELS_RAW === "string" &&
    EMBEDDING_MODELS_RAW.trim().length > 0;
  const agentAliasOptions =
    DEFAULT_AGENT_ALIASES.length > 0 ? DEFAULT_AGENT_ALIASES : ["default"];
  const isAgentAliasConfigured = DEFAULT_AGENT_ALIASES.length > 0;
  const [agentAliasId, setAgentAliasId] = useState(() => agentAliasOptions[0]);
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
      if (!trimmedContent || isLoading || isEmbedding) return;

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
        const resolvedAgentAliasId = resolveOption(
          agentAliasId,
          agentAliasOptions,
        );
        const requestedAgentAliasId =
          resolvedAgentAliasId === "default" ? undefined : resolvedAgentAliasId;
        await sendChatMessage(
          apiEndpoint,
          trimmedContent,
          sessionId,
          requestedAgentAliasId,
          {
            onChunk: (data) => appendChunk(data.text),
            onComplete: finalizeMessage,
            onError: (data) => setErrorMessage(data.message),
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setErrorMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      apiEndpoint,
      sessionId,
      agentAliasId,
      isLoading,
      isEmbedding,
      agentAliasOptions,
    ],
  );

  const handleEmbed = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isEmbedding || isLoading) return;

      setIsEmbedding(true);
      const requestMessage = createMessage(
        "assistant",
        `Embedding request queued (model: ${embeddingModelId}).`,
      );
      const requestMessageId = requestMessage.id;
      setMessages((prev) => [...prev, requestMessage]);

      try {
        const resolvedEmbeddingModelId = resolveOption(
          embeddingModelId,
          DEFAULT_EMBEDDING_MODELS,
        );
        const result = await getTextEmbedding(
          apiEndpoint,
          trimmedContent,
          resolvedEmbeddingModelId,
        );

        const summary = [
          `Embedding generated.`,
          `Model: ${result.modelId}`,
          `Vector size: ${result.embedding.length}`,
          result.inputTextTokenCount !== undefined
            ? `Input tokens: ${result.inputTextTokenCount}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");

        setMessages((prev) =>
          updateMessageById(prev, requestMessageId, (message) => ({
            ...message,
            content: summary,
            embedding: {
              modelId: result.modelId,
              vector: result.embedding,
              inputTextTokenCount: result.inputTextTokenCount,
            },
          })),
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setMessages((prev) =>
          updateMessageById(prev, requestMessageId, (message) => ({
            ...message,
            content: `Embedding error: ${errorMessage}`,
          })),
        );
      } finally {
        setIsEmbedding(false);
      }
    },
    [apiEndpoint, embeddingModelId, isEmbedding, isLoading],
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
        {!isAgentAliasConfigured ? (
          <p className="mb-1 text-[11px] text-gray-500">
            Agent alias options are not set. Configure
            <code> VITE_AGENT_ALIAS_OPTIONS</code> if needed.
          </p>
        ) : null}
        {!isEmbeddingModelConfigured ? (
          <p className="mb-1 text-[11px] text-gray-500">
            Embedding model options are not set. Configure
            <code> VITE_EMBEDDING_MODEL_OPTIONS</code> if needed.
          </p>
        ) : null}
        <MessageInput
          onSend={handleSendMessage}
          onEmbed={handleEmbed}
          agentAliases={agentAliasOptions}
          agentAliasId={agentAliasId}
          onAgentAliasChange={(value) =>
            setAgentAliasId(resolveOption(value, agentAliasOptions))
          }
          embeddingModels={DEFAULT_EMBEDDING_MODELS}
          embeddingModelId={embeddingModelId}
          onEmbeddingModelChange={(value) =>
            setEmbeddingModelId(resolveOption(value, DEFAULT_EMBEDDING_MODELS))
          }
          disabled={isLoading}
          embeddingDisabled={isEmbedding}
        />
      </footer>
    </div>
  );
}
