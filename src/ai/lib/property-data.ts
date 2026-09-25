import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/auth";
import type { PublicProperty } from "@/ai/types/property";

const publicPropertySelect = {
  id: true,
  propertyType: true,
  bhk: true,
  sector: true,
  monthlyRent: true,
  furnishing: true,
  furnishingDetails: true,
  areaSqFt: true,
  vastu: true,
  availableFrom: true,
  societyName: true,
  description: true,
  media: {
    select: {
      id: true,
      type: true,
      secureUrl: true,
      position: true,
    },
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
  },
  createdAt: true,
} satisfies Prisma.PropertySelect;

export type PropertySearchFilters = {
  bhk?: string;
  sector?: string;
  maxRent?: number;
  minRent?: number;
  furnishing?: string;
  propertyType?: string;
};

function cleanFilter(value: string | undefined, maxLength = 80) {
  const cleaned = value?.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function buildPropertyWhere(filters: PropertySearchFilters): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { status: "AVAILABLE" };
  const bhk = cleanFilter(filters.bhk, 20);
  const sector = cleanFilter(filters.sector, 40);
  const furnishing = cleanFilter(filters.furnishing, 40);
  const propertyType = cleanFilter(filters.propertyType, 40);

  if (bhk) where.bhk = { contains: bhk };
  if (sector) where.sector = { contains: sector.replace(/^sector\s*/i, "") };
  if (furnishing) where.furnishing = { contains: furnishing };
  if (propertyType) where.propertyType = { contains: propertyType };
  if (filters.minRent !== undefined || filters.maxRent !== undefined) {
    where.monthlyRent = {
      ...(filters.minRent !== undefined ? { gte: filters.minRent } : {}),
      ...(filters.maxRent !== undefined ? { lte: filters.maxRent } : {}),
    };
  }

  return where;
}

function normalizeRent(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(Math.max(Math.trunc(value), 0), 10_000_000);
}

export async function searchPublicProperties(filters: PropertySearchFilters = {}) {
  const minRent = normalizeRent(filters.minRent);
  const maxRent = normalizeRent(filters.maxRent);

  const properties = await prisma.property.findMany({
    where: buildPropertyWhere({ ...filters, minRent, maxRent }),
    select: publicPropertySelect,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return properties as PublicProperty[];
}

export async function getPublicPropertyDetails(propertyId: number) {
  if (!Number.isInteger(propertyId) || propertyId <= 0) return null;

  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: "AVAILABLE" },
    select: publicPropertySelect,
  });

  return property as PublicProperty | null;
}

export async function getAvailablePublicProperties(limit = 10) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);

  const properties = await prisma.property.findMany({
    where: { status: "AVAILABLE" },
    select: publicPropertySelect,
    orderBy: { createdAt: "desc" },
    take: safeLimit,
  });

  return properties as PublicProperty[];
}

export async function comparePublicProperties(propertyIds: number[]) {
  const safeIds = [...new Set(propertyIds)]
    .filter((propertyId) => Number.isInteger(propertyId) && propertyId > 0)
    .slice(0, 4);

  if (safeIds.length < 2) return [];

  const properties = await prisma.property.findMany({
    where: { id: { in: safeIds }, status: "AVAILABLE" },
    select: publicPropertySelect,
  });

  const propertiesById = new Map(properties.map((property) => [property.id, property]));
  return safeIds
    .map((propertyId) => propertiesById.get(propertyId))
    .filter((property): property is (typeof properties)[number] => Boolean(property)) as PublicProperty[];
}