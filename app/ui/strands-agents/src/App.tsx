import { useState } from "react";
import { ChatInterface } from "./components/ChatInterface";

function App() {
  const [apiEndpoint, setApiEndpoint] = useState(
    () => import.meta.env.VITE_API_ENDPOINT || "",
  );
  const isConfigured = apiEndpoint.trim().length > 0;

  const handleConfigure = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const endpoint = (formData.get("endpoint") as string | null)?.trim();
    if (endpoint) {
      setApiEndpoint(endpoint);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Strands Agents Chat
          </h1>
          <p className="text-gray-600 mb-4">
            Enter your API Gateway endpoint to start chatting.
          </p>
          <form onSubmit={handleConfigure}>
            <input
              type="url"
              name="endpoint"
              placeholder="https://xxxxxx.execute-api.ap-northeast-1.amazonaws.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Connect
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <ChatInterface apiEndpoint={apiEndpoint} />;
}

export default App;
