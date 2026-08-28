import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const name = data.name?.trim();
    const phone = data.phone?.trim();
    const email = data.email?.trim() || null;
    const password = data.password;

    // Basic validation
    if (!name || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, phone and password are required.",
        },
        { status: 400 }
      );
    }

    // Check phone already registered
    const existingPhone = await prisma.user.findUnique({
      where: {
        phone,
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is already registered.",
        },
        { status: 409 }
      );
    }

    // Check email only if email is provided
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "Email is already registered.",
          },
          { status: 409 }
        );
      }
    }

    // Password securely hash karna
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create owner/broker account
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        role: "OWNER",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("========== SIGNUP ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create account.",
      },
      { status: 500 }
    );
  }
}