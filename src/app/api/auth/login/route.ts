import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// =========================================================
// DATABASE CONNECTION
// =========================================================

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

// =========================================================
// POST /api/auth/login
// =========================================================

export async function POST(request: Request) {
  try {
    // -------------------------------------------------------
    // RECEIVE LOGIN DATA
    // -------------------------------------------------------

    const data = await request.json();

    const identifier = data.email?.trim().toLowerCase();
    const password = data.password;

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email or phone and password are required.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user = await prisma.user.findUnique({
      where: identifier.includes("@")
        ? { email: identifier }
        : { phone: identifier },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------
    // PASSWORD CHECK
    // -------------------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------
    // CREATE SECURE SESSION TOKEN
    // -------------------------------------------------------

    const sessionToken = randomBytes(32).toString("hex");

    // Session 7 days ke liye valid rahega.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // -------------------------------------------------------
    // SAVE SESSION IN DATABASE
    // -------------------------------------------------------

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    console.log("User logged in:", user.email || user.phone);

    // -------------------------------------------------------
    // CREATE RESPONSE
    // -------------------------------------------------------

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // -------------------------------------------------------
    // HTTP-ONLY AUTHENTICATION COOKIE
    // -------------------------------------------------------

    response.cookies.set({
      name: "session_token",
      value: sessionToken,

      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    // -------------------------------------------------------
    // ERROR HANDLING
    // -------------------------------------------------------

    console.error("========== LOGIN ERROR ==========");
    console.error(error);
    console.error("Message:", error instanceof Error ? error.message : "Unknown error");
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to login.",
      },
      { status: 500 }
    );
  }
}