import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { cookies } from "next/headers";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

// =========================================================
// GET /api/admin/properties
// ADMIN ONLY
// Get pending properties for review. This endpoint includes
// private details that must never be returned by public APIs.
// =========================================================
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Please login first.",
        },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: {
        token: sessionToken,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session. Please login again.",
        },
        { status: 401 }
      );
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please login again.",
        },
        { status: 401 }
      );
    }

    if (session.user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Admin access required.",
        },
        { status: 403 }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
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
        ownerName: true,
        ownerPhone: true,
        ownerEmail: true,
        status: true,
        createdAt: true,
        media: {
          select: {
            id: true,
            type: true,
            secureUrl: true,
            resourceType: true,
            position: true,
          },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error("========== ADMIN PROPERTY REVIEW GET ERROR ==========");
    console.error(error);
    console.error("=====================================================");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load properties for review.",
      },
      { status: 500 }
    );
  }
}
