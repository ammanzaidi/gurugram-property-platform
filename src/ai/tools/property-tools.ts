import { jsonSchema, tool } from "ai";
import {
  getAvailablePublicProperties,
  getPublicPropertyDetails,
  searchPublicProperties,
  comparePublicProperties,
} from "@/ai/lib/property-data";

type SearchPropertiesInput = {
  bhk?: string;
  sector?: string;
  maxRent?: number;
  minRent?: number;
  furnishing?: string;
  propertyType?: string;
};

export const propertyTools = {
  searchProperties: tool({
    description: "Search AVAILABLE properties using public listing fields only.",
    inputSchema: jsonSchema<SearchPropertiesInput>({
      type: "object",
      additionalProperties: false,
      properties: {
        bhk: { type: "string", description: "BHK value such as 2 BHK or 3 BHK" },
        sector: { type: "string", description: "Gurugram sector" },
        minRent: { type: "number", minimum: 0 },
        maxRent: { type: "number", minimum: 0 },
        furnishing: { type: "string" },
        propertyType: { type: "string" },
      },
    }),
    execute: async (input) => {
      if (input.minRent !== undefined && input.maxRent !== undefined && input.minRent > input.maxRent) {
        return { properties: [], error: "The minimum rent cannot exceed the maximum rent." };
      }
      return { properties: await searchPublicProperties(input) };
    },
  }),
  getPublicPropertyDetails: tool({
    description: "Get one AVAILABLE property by ID using public listing fields only.",
    inputSchema: jsonSchema<{ propertyId: number }>({
      type: "object",
      additionalProperties: false,
      required: ["propertyId"],
      properties: {
        propertyId: { type: "integer", minimum: 1 },
      },
    }),
    execute: async ({ propertyId }) => ({
      property: await getPublicPropertyDetails(propertyId),
    }),
  }),
  getAvailableProperties: tool({
    description: "List a small set of the newest AVAILABLE properties using public fields only.",
    inputSchema: jsonSchema<{ limit?: number }>({
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 20 },
      },
    }),
    execute: async ({ limit }) => ({
      properties: await getAvailablePublicProperties(limit),
    }),
  }),
  compareProperties: tool({
    description: "Compare two to four AVAILABLE properties by public listing fields only.",
    inputSchema: jsonSchema<{ propertyIds: number[] }>({
      type: "object",
      additionalProperties: false,
      required: ["propertyIds"],
      properties: {
        propertyIds: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          uniqueItems: true,
          items: { type: "integer", minimum: 1 },
        },
      },
    }),
    execute: async ({ propertyIds }) => ({
      properties: await comparePublicProperties(propertyIds),
    }),
  }),
  propertyEnquiryGuidance: tool({
    description: "Explain the existing tenant enquiry and visit workflow without creating an enquiry.",
    inputSchema: jsonSchema<Record<string, never>>({
      type: "object",
      additionalProperties: false,
    }),
    execute: async () => ({
      guidance:
        "To enquire about an available property, sign in with a tenant account, open the property's detail page, and submit the existing enquiry form. The platform records the enquiry for the business team, who coordinates the next steps and visit. The assistant cannot submit enquiries, schedule visits, or provide owner or broker contact details.",
    }),
  }),
};