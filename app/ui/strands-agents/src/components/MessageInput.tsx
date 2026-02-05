import { useCallback, useState } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  onEmbed: (message: string) => void;
  agentAliases: string[];
  agentAliasId: string;
  onAgentAliasChange: (agentAliasId: string) => void;
  embeddingModels: string[];
  embeddingModelId: string;
  onEmbeddingModelChange: (modelId: string) => void;
  disabled?: boolean;
  embeddingDisabled?: boolean;
}

export function MessageInput({
  onSend,
  onEmbed,
  agentAliases,
  agentAliasId,
  onAgentAliasChange,
  embeddingModels,
  embeddingModelId,
  onEmbeddingModelChange,
  disabled,
  embeddingDisabled,
}: MessageInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !disabled) {
        onSend(trimmed);
        setInput("");
      }
    },
    [input, onSend, disabled],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        return;
      }
    },
    [],
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Use the Send button to submit)"
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{
              minHeight: "48px",
              maxHeight: "200px",
            }}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="bg-blue-500 text-white rounded-xl px-6 py-3 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {disabled ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  role="img"
                >
                  <title>Sending</title>
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            ) : (
              "Send"
            )}
          </button>
          <button
            type="button"
            onClick={() => onEmbed(input.trim())}
            disabled={embeddingDisabled || !input.trim()}
            className="bg-blue-500 text-white rounded-xl px-4 py-3 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Embed
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600" htmlFor="agent-alias">
            Agent alias
          </label>
          <select
            id="agent-alias"
            value={agentAliasId}
            onChange={(e) => onAgentAliasChange(e.target.value)}
            disabled={disabled}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {agentAliases.map((alias) => (
              <option key={alias} value={alias}>
                {alias}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-600" htmlFor="embedding-model">
            Embedding model
          </label>
          <select
            id="embedding-model"
            value={embeddingModelId}
            onChange={(e) => onEmbeddingModelChange(e.target.value)}
            disabled={disabled}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {embeddingModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
