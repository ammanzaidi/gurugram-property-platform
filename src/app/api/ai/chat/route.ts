import { NextResponse } from "next/server";
import { runPropertyAgent } from "@/ai/agents/property-agent";

const MAX_MESSAGE_LENGTH = 2_000;

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

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: "The property assistant is temporarily unavailable." },
        { status: 503 }
      );
    }

    const response = await runPropertyAgent(message.trim());
    return NextResponse.json({ success: true, message: response });
  } catch {
    // Keep provider, database, and request details out of the client response.
    return NextResponse.json(
      { success: false, error: "The property assistant is temporarily unavailable." },
      { status: 502 }
    );
  }
}