import { NextResponse } from "next/server";
import { runPropertyAgent } from "@/ai/agents/property-agent";
import { OllamaUnavailableError } from "@/ai/lib/ollama";

const MAX_MESSAGE_LENGTH = 2_000;

function logAiFailure(error: unknown) {
  console.error("[api/ai/chat] Ollama request failed", JSON.stringify({
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown Ollama failure",
  }));
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? (body as { message?: unknown }).message
        : undefined;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a message." },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Please keep your message under 2,000 characters." },
        { status: 400 }
      );
    }

    const response = await runPropertyAgent(message.trim());
    return NextResponse.json({
      success: true,
      message: response.message,
      properties: response.properties,
    });
  } catch (error) {
    // Keep local provider, database, and request details out of the client response.
    logAiFailure(error);
    return NextResponse.json(
      { success: false, error: "The local property assistant is unavailable. Please try again shortly." },
      { status: error instanceof OllamaUnavailableError ? 503 : 502 }
    );
  }
}