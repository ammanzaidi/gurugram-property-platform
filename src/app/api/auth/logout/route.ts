import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

export async function POST() {
  try {
    // Get session token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    // Delete session from database
    if (sessionToken) {
      await prisma.session.deleteMany({
        where: {
          token: sessionToken,
        },
      });
    }

    // Clear cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set({
      name: "session_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("========== LOGOUT ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to logout.",
      },
      { status: 500 }
    );
  }
}