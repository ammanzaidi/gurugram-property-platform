import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

// =========================================================
// GET /api/auth/me
// Check currently logged-in user
// =========================================================

export async function GET() {
  try {
    // -------------------------------------------------------
    // GET SESSION COOKIE
    // -------------------------------------------------------

    const sessionToken = (
      await import("next/headers")
    ).cookies;

    const cookieStore = await sessionToken();
    const token = cookieStore.get("session_token")?.value;

    // No session
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------
    // FIND SESSION
    // -------------------------------------------------------

    const session = await prisma.session.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    // Session doesn't exist
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Invalid session.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------
    // CHECK SESSION EXPIRY
    // -------------------------------------------------------

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: {
          id: session.id,
        },
      });

      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Session expired.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error("AUTH ME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Failed to check authentication.",
      },
      { status: 500 }
    );
  }
}