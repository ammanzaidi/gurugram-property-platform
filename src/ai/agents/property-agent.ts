import { chatWithOllama } from "@/ai/lib/ollama";
import type { PropertySearchFilters } from "@/ai/lib/property-data";
import { propertyTools } from "@/ai/tools/property-tools";
import { PROPERTY_ASSISTANT_SYSTEM_PROMPT } from "@/ai/prompts/property-assistant";

const TOOL_NAMES = Object.keys(propertyTools);
const PRIVATE_INFORMATION_PATTERN = /owner|broker|phone|mobile|email|contact|exact address|exact location/i;

type ToolAction = {
  tool: string;
  arguments: Record<string, unknown>;
};

type PublicProperty = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  furnishingDetails: string | null;
  areaSqFt: number | null;
  vastu: string | null;
  availableFrom: Date | string;
  societyName: string | null;
};

export type PropertySuggestion = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  areaSqFt: number | null;
  societyName: string | null;
};

function toPropertySuggestions(properties: PublicProperty[]): PropertySuggestion[] {
  return properties.map(({ id, propertyType, bhk, sector, monthlyRent, furnishing, areaSqFt, societyName }) => ({
    id,
    propertyType,
    bhk,
    sector,
    monthlyRent,
    furnishing,
    areaSqFt,
    societyName,
  }));
}

function formatToolResult(result: unknown) {
  if (typeof result !== "object" || result === null) {
    return { message: "I could not find a public result for that request.", properties: [] };
  }

  const data = result as {
    properties?: PublicProperty[];
    property?: PublicProperty | null;
    guidance?: string;
    error?: string;
  };

  if (data.error) return { message: data.error, properties: [] };
  if (data.guidance) return { message: data.guidance, properties: [] };

  const properties = data.properties || (data.property ? [data.property] : []);
  return {
    message: properties.length > 0
      ? "Here are the matching available properties."
      : "The database has no matching AVAILABLE properties.",
    properties: toPropertySuggestions(properties),
  };
}

function parseMoney(value: string) {
  const amount = Number(value.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : undefined;
}

function extractPropertyFilters(message: string): PropertySearchFilters {
  const filters: PropertySearchFilters = {};
  const bhk = message.match(/\b(\d+)\s*BHK\b/i);
  const sector = message.match(/\b(?:sector|sec)\s*[-#]?\s*([0-9]+[A-Za-z]?)\b/i)
    ?? message.match(/\bin\s+([0-9]+[A-Za-z]?)(?!\s*BHK)\b/i);
  const maxRent = message.match(/\b(?:under|below|up\s*to|upto|less\s*than|max(?:imum)?(?:\s+budget)?(?:\s+of)?)\s*₹?\s*([\d,]+)/i);
  const minRent = message.match(/\b(?:above|over|more\s*than|at\s*least)\s*₹?\s*([\d,]+)/i);
  const furnishing = message.match(/\b(semi[-\s]?furnished|fully[-\s]?furnished|unfurnished|furnished)\b/i);
  const propertyType = message.match(/\b(apartment|builder\s+floor|villa|house|studio)\b/i);

  if (bhk) filters.bhk = `${bhk[1]} BHK`;
  if (sector) filters.sector = `Sector ${sector[1]}`;
  if (maxRent) filters.maxRent = parseMoney(maxRent[1]);
  if (minRent) filters.minRent = parseMoney(minRent[1]);
  if (furnishing) filters.furnishing = furnishing[1].replace(/[-\s]+/g, " ");
  if (propertyType) filters.propertyType = propertyType[1].replace(/\s+/g, " ");

  return filters;
}

function parseToolAction(content: string): ToolAction | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

    const action = parsed as Partial<ToolAction> & { args?: unknown };
    const actionArguments = action.arguments ?? action.args;
    if (
      typeof action.tool !== "string" ||
      !TOOL_NAMES.includes(action.tool) ||
      typeof actionArguments !== "object" ||
      actionArguments === null ||
      Array.isArray(actionArguments)
    ) {
      return null;
    }

    return { tool: action.tool, arguments: actionArguments as Record<string, unknown> };
  } catch {
    return null;
  }
}

async function executePropertyTool(action: ToolAction) {
  const selectedTool = propertyTools[action.tool as keyof typeof propertyTools] as unknown as {
    execute?: (input: Record<string, unknown>, options?: unknown) => Promise<unknown>;
  };

  if (!selectedTool.execute) return null;
  return selectedTool.execute(action.arguments, {});
}

export async function runPropertyAgent(message: string) {
  if (PRIVATE_INFORMATION_PATTERN.test(message)) {
    return {
      message: "I cannot provide owner or broker contact details, private contact information, or exact property addresses or locations.",
      properties: [],
    };
  }

  const extractedFilters = extractPropertyFilters(message);
  const hasSearchFilters = Object.keys(extractedFilters).length > 0;

  // Qwen receives a strict JSON action because this local setup cannot rely on native tool calling.
  const actionContent = hasSearchFilters ? "" : await chatWithOllama([
    {
      role: "system",
      content: `${PROPERTY_ASSISTANT_SYSTEM_PROMPT}

Choose exactly one existing tool for property or enquiry questions. Return only JSON in this shape:
{"tool":"toolName","arguments":{}}
Available tools: ${TOOL_NAMES.join(", ")}
For greetings or questions outside these tools, return {"tool":"propertyEnquiryGuidance","arguments":{}} only when it is about the enquiry or visit workflow. Otherwise return {"tool":"getAvailableProperties","arguments":{}}.
Never include property facts in this action; facts must come from the selected database tool.`,
    },
    { role: "user", content: message },
  ], "json");

  // Explicit constraints always use the database search tool; the model cannot broaden them to all listings.
  const action = hasSearchFilters
    ? { tool: "searchProperties", arguments: extractedFilters }
    : parseToolAction(actionContent);
  if (!action) {
    return {
      message: "I can help you search available Gurugram properties, compare listings, or understand the enquiry process.",
      properties: [],
    };
  }

  const toolResult = await executePropertyTool(action);
  if (toolResult === null) {
    return { message: "I could not safely process that property request. Please try again.", properties: [] };
  }

  // Return only fields already selected by the public database tools; Qwen never invents listing facts.
  return formatToolResult(toolResult);
}