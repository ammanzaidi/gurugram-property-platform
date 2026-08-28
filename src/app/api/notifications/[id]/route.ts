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
// PATCH /api/notifications/[id]
// MARK NOTIFICATION AS READ
// =========================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =======================================================
    // CHECK LOGIN
    // =======================================================

    const cookieStore = await cookies();

    const sessionToken =
      cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Please login first.",
        },
        { status: 401 }
      );
    }

    // =======================================================
    // FIND SESSION
    // =======================================================

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

    // =======================================================
    // CHECK SESSION EXPIRY
    // =======================================================

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please login again.",
        },
        { status: 401 }
      );
    }

    // =======================================================
    // GET NOTIFICATION ID
    // =======================================================

    const { id } = await params;

    const notificationId = Number(id);

    if (
      !Number.isInteger(notificationId) ||
      notificationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid notification ID.",
        },
        { status: 400 }
      );
    }

    // =======================================================
    // FIND NOTIFICATION
    // IMPORTANT:
    // Only the logged-in user's notification can be updated.
    // =======================================================

    const notification =
      await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: session.userId,
        },
      });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found.",
        },
        { status: 404 }
      );
    }

    // =======================================================
    // MARK AS READ
    // =======================================================

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          isRead: true,
        },
      });

    // =======================================================
    // SUCCESS
    // =======================================================

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
      notification: updatedNotification,
    });
  } catch (error: any) {
    console.error(
      "========== MARK NOTIFICATION READ ERROR =========="
    );

    console.error(error);
    console.error("Message:", error?.message);

    console.error(
      "==================================================="
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to mark notification as read.",
      },
      { status: 500 }
    );
  }
}