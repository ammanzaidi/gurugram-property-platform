import { jsonSchema, tool } from "ai";
import {
  getAvailablePublicProperties,
  getPublicPropertyDetails,
  searchPublicProperties,
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
};