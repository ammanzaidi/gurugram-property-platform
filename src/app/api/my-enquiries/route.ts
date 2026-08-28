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

export async function GET() {
  try {
    // Check login
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

    // Find session
    const session = await prisma.session.findUnique({
      where: {
        token: sessionToken,
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

    // Check expiry
    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please login again.",
        },
        { status: 401 }
      );
    }

    // Get only logged-in user's enquiries
    const enquiries = await prisma.enquiry.findMany({
      where: {
        tenantId: session.userId,
      },
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      enquiries,
    });
  } catch (error: any) {
    console.error("========== MY ENQUIRIES GET ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("============================================");

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load your enquiries.",
      },
      { status: 500 }
    );
  }
}