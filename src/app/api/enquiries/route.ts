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
// POST /api/enquiries
// Tenant enquiry submit karega
// =========================================================

export async function POST(request: Request) {
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

    const data = await request.json();

    const propertyId = Number(data.propertyId);
    const name = data.name?.trim();
    const phone = data.phone?.trim();
    const email = data.email?.trim().toLowerCase();
    const message = data.message?.trim();
    const moveInDate = data.moveInDate?.trim();

    if (!propertyId || !name || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Property, name and phone are required.",
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
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

    const enquiry = await prisma.enquiry.create({
      data: {
        propertyId,
        tenantId: session.userId,
        name,
        phone,
        email: email || null,
        message: message || null,
        moveInDate: moveInDate || null,
        status: "NEW",
      },
    });

    console.log(
      "New property enquiry:",
      enquiry.id,
      "Property:",
      propertyId,
      "Tenant:",
      session.userId
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your enquiry has been submitted successfully.",
        enquiry: {
          id: enquiry.id,
          propertyId: enquiry.propertyId,
          status: enquiry.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("========== ENQUIRY POST ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to submit enquiry.",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// GET /api/enquiries
// ADMIN ONLY
// =========================================================

export async function GET() {
  try {
    // -------------------------------------------------------
    // CHECK SESSION
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // CHECK SESSION EXPIRY
    // -------------------------------------------------------

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please login again.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------
    // ADMIN CHECK
    // -------------------------------------------------------

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Admin access required.",
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------
    // FETCH ENQUIRIES
    // -------------------------------------------------------

    const enquiries = await prisma.enquiry.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        property: {
          select: {
            id: true,
            propertyType: true,
            bhk: true,
            sector: true,
            monthlyRent: true,
            societyName: true,

            // PRIVATE OWNER DETAILS
            ownerName: true,
            ownerPhone: true,
            ownerEmail: true,
          },
        },
      },
    });

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return NextResponse.json({
      success: true,
      enquiries,
    });
  } catch (error: any) {
    console.error("========== ENQUIRY GET ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load enquiries.",
      },
      { status: 500 }
    );
  }
}