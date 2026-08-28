import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const sessionToken = (await cookies()).get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Please login first." }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session. Please login again." },
        { status: 401 }
      );
    }

    const role = session.user.role.toUpperCase();
    if (!["OWNER", "BROKER", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const properties = await prisma.property.findMany({
      where: role === "ADMIN" ? undefined : { ownerId: session.user.id },
      select: {
        id: true,
        propertyType: true,
        bhk: true,
        sector: true,
        monthlyRent: true,
        status: true,
        createdAt: true,
        media: {
          select: { id: true, type: true, secureUrl: true, position: true },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, properties });
  } catch (error) {
    console.error("MY PROPERTIES GET ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load your properties." },
      { status: 500 }
    );
  }
}
