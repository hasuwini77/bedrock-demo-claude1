"use client";
// src/app/components/Chat.tsx
import { useState } from "react";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse(""); // Clear previous response

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Failed to fetch response");

      // Handle streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text and append to response
        const text = new TextDecoder().decode(value);
        setResponse((prev) => prev + text);
      }
    } catch (error) {
      console.error("Error:", error);
      setResponse("Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setPrompt("");
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-600">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask your question..."
          className="w-full p-2 border rounded  bg-gray-700"
          rows={4}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>

      {response && (
        <div className="mt-4 p-4 border rounded bg-gray-700">
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
}
