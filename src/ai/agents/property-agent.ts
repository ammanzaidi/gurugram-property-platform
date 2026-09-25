import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { propertyTools } from "@/ai/tools/property-tools";
import { PROPERTY_ASSISTANT_SYSTEM_PROMPT } from "@/ai/prompts/property-assistant";

export const AI_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

export async function runPropertyAgent(message: string) {
  const result = await generateText({
    model: openai(AI_MODEL),
    system: PROPERTY_ASSISTANT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: message }],
    tools: propertyTools,
    stopWhen: stepCountIs(4),
    maxRetries: 1,
  });

  return result.text;
}