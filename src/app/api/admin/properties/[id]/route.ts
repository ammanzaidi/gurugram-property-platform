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
// PATCH /api/admin/properties/[id]
// ADMIN ONLY
// A pending property can only be approved or rejected.
// =========================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const propertyId = Number(id);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid property ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body.status;

    if (status !== "AVAILABLE" && status !== "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          error: "A pending property can only be approved or rejected.",
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found.",
        },
        { status: 404 }
      );
    }

    if (property.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Only pending properties can be approved or rejected.",
        },
        { status: 400 }
      );
    }

    const updatedProperty = await prisma.property.update({
      where: {
        id: propertyId,
      },
      data: {
        status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        status === "AVAILABLE"
          ? "Property approved and made available publicly."
          : "Property rejected and kept hidden from public listings.",
      property: updatedProperty,
    });
  } catch (error) {
    console.error("========== ADMIN PROPERTY REVIEW PATCH ERROR ==========");
    console.error(error);
    console.error("=======================================================");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update property status.",
      },
      { status: 500 }
    );
  }
}
