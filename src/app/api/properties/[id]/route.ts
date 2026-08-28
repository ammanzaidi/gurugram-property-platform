import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const propertySelect = {
  id: true,
  ownerId: true,
  propertyType: true,
  bhk: true,
  sector: true,
  monthlyRent: true,
  furnishing: true,
  furnishingDetails: true,
  availableFrom: true,
  areaSqFt: true,
  vastu: true,
  societyName: true,
  address: true,
  description: true,
  status: true,
  createdAt: true,
  media: {
    select: {
      id: true,
      type: true,
      secureUrl: true,
      resourceType: true,
      position: true,
      createdAt: true,
    },
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
  },
};

async function getSession() {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

async function getAuthorizedProperty(propertyId: number) {
  const session = await getSession();
  if (!session) return { error: "Invalid or expired session. Please login again.", status: 401 as const };

  const role = session.user.role.toUpperCase();
  if (!["OWNER", "BROKER", "ADMIN"].includes(role)) {
    return { error: "Access denied.", status: 403 as const };
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: propertySelect,
  });

  if (!property) return { error: "Property not found.", status: 404 as const };
  if (role !== "ADMIN" && property.ownerId !== session.user.id) {
    return { error: "You can only manage your own properties.", status: 403 as const };
  }

  return { property, session, role };
}

function getPropertyId(id: string) {
  const propertyId = Number(id);
  return Number.isInteger(propertyId) && propertyId > 0 ? propertyId : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const propertyId = getPropertyId((await params).id);
    if (!propertyId) {
      return NextResponse.json({ success: false, error: "Invalid property ID." }, { status: 400 });
    }

    const authorization = await getAuthorizedProperty(propertyId);
    if ("error" in authorization) {
      return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
    }

    return NextResponse.json({ success: true, property: authorization.property });
  } catch (error) {
    console.error("PROPERTY MANAGEMENT GET ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to load property." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const propertyId = getPropertyId((await params).id);
    if (!propertyId) {
      return NextResponse.json({ success: false, error: "Invalid property ID." }, { status: 400 });
    }

    const authorization = await getAuthorizedProperty(propertyId);
    if ("error" in authorization) {
      return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
    }

    const body = await request.json();
    const stringFields = [
      "propertyType",
      "bhk",
      "sector",
      "furnishing",
      "availableFrom",
      "societyName",
    ] as const;
    const nullableStringFields = ["furnishingDetails", "vastu", "description"] as const;
    const data: Record<string, string | number | null> = {};

    for (const field of stringFields) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json({ success: false, error: `${field} is required.` }, { status: 400 });
      }
      data[field] = body[field].trim();
    }

    for (const field of nullableStringFields) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== "string") {
        return NextResponse.json({ success: false, error: `${field} must be text.` }, { status: 400 });
      }
      data[field] = typeof body[field] === "string" && body[field].trim() ? body[field].trim() : null;
    }

    const monthlyRent = Number(body.monthlyRent);
    const areaSqFt = Number(body.areaSqFt);
    if (!Number.isInteger(monthlyRent) || monthlyRent < 0 || !Number.isInteger(areaSqFt) || areaSqFt < 0) {
      return NextResponse.json({ success: false, error: "Rent and area must be valid non-negative numbers." }, { status: 400 });
    }
    data.monthlyRent = monthlyRent;
    data.areaSqFt = areaSqFt;

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...data,
        status: "PENDING",
      },
      select: propertySelect,
    });

    return NextResponse.json({
      success: true,
      message: "Property updated and sent for admin review.",
      property: updatedProperty,
    });
  } catch (error) {
    console.error("PROPERTY MANAGEMENT PATCH ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to update property." }, { status: 500 });
  }
}
