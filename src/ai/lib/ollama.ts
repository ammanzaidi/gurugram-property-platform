const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "qwen2.5:3b";
const OLLAMA_TIMEOUT_MS = 180_000;

type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: {
    content?: unknown;
  };
};

export class OllamaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaUnavailableError";
  }
}

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;

function getOllamaUrl() {
  return (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_URL).replace(/\/$/, "");
}

// This client is server-only: Ollama is contacted directly and no credentials are sent to the browser.
export async function chatWithOllama(messages: OllamaMessage[], format?: "json") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${getOllamaUrl()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        ...(format ? { format, options: { num_predict: 128, temperature: 0 } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new OllamaUnavailableError(`Ollama request failed with status ${response.status}`);
    }

    const result = (await response.json()) as OllamaChatResponse;
    if (typeof result.message?.content !== "string") {
      throw new Error("Ollama returned an invalid chat response");
    }

    return result.message.content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new OllamaUnavailableError("Ollama request timed out");
    }
    if (error instanceof TypeError) {
      throw new OllamaUnavailableError("Ollama is unavailable");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
