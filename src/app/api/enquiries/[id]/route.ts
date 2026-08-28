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
// PATCH /api/enquiries/[id]
// ADMIN ONLY
// Update enquiry status + visit details
// =========================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // -------------------------------------------------------
    // CHECK LOGIN
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
    // FIND SESSION + USER
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

    if (session.user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Admin access required.",
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------
    // GET ENQUIRY ID
    // -------------------------------------------------------

    const { id } = await params;
    const enquiryId = Number(id);

    if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid enquiry ID.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // READ REQUEST BODY
    // -------------------------------------------------------

    const body = await request.json();

    const status = body.status;
    const visitDate = body.visitDate?.trim() || null;
    const visitTime = body.visitTime?.trim() || null;

    // -------------------------------------------------------
    // ALLOWED STATUSES
    // -------------------------------------------------------

    const allowedStatuses = [
  "NEW",
  "CONTACTED",
  "VISIT_SCHEDULED",
  "VISIT_COMPLETED",
  "CLOSED",
];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid enquiry status.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // VALIDATE VISIT DETAILS
    // -------------------------------------------------------

    if (status === "VISIT_SCHEDULED") {
      if (!visitDate || !visitTime) {
        return NextResponse.json(
          {
            success: false,
            error: "Visit date and visit time are required.",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------------
    // CHECK ENQUIRY EXISTS
    // -------------------------------------------------------

    const existingEnquiry = await prisma.enquiry.findUnique({
      where: {
        id: enquiryId,
      },
    });

    if (!existingEnquiry) {
      return NextResponse.json(
        {
          success: false,
          error: "Enquiry not found.",
        },
        { status: 404 }
      );
    }

    // -------------------------------------------------------
    // UPDATE ENQUIRY
    // -------------------------------------------------------

    const enquiry = await prisma.enquiry.update({
      where: {
        id: enquiryId,
      },
      data: {
        status,

        // Save visit details only when scheduling a visit
        visitDate: status === "VISIT_SCHEDULED" ? visitDate : null,
        visitTime: status === "VISIT_SCHEDULED" ? visitTime : null,
      },
    });

    // -------------------------------------------------------
// CREATE NOTIFICATION FOR TENANT
// -------------------------------------------------------

let notificationTitle = "";
let notificationMessage = "";
let notificationType = "INFO";

if (status === "CONTACTED") {
  notificationTitle = "Enquiry Contacted";
  notificationMessage = `Our team has contacted you regarding Enquiry #${enquiry.id}.`;
  notificationType = "INFO";
}

if (status === "VISIT_SCHEDULED") {
  notificationTitle = "Property Visit Scheduled";
  notificationMessage = `Your property visit has been scheduled for ${enquiry.visitDate} at ${enquiry.visitTime}.`;
  notificationType = "VISIT";
}

if (status === "VISIT_COMPLETED") {
  notificationTitle = "Property Visit Completed";
  notificationMessage = `Your property visit for Enquiry #${enquiry.id} has been completed.`;
  notificationType = "VISIT";
}

if (status === "CLOSED") {
  notificationTitle = "Enquiry Closed";
  notificationMessage = `Your property enquiry #${enquiry.id} has been closed.`;
  notificationType = "SUCCESS";
}

if (notificationMessage) {
  await prisma.notification.create({
    data: {
      userId: existingEnquiry.tenantId,
      enquiryId: enquiry.id,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
    },
  });

  console.log(
    "Notification created for tenant:",
    existingEnquiry.tenantId
  );
}

    console.log(
      "Enquiry updated:",
      enquiry.id,
      "Status:",
      enquiry.status,
      "Visit Date:",
      enquiry.visitDate,
      "Visit Time:",
      enquiry.visitTime
    );

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return NextResponse.json({
      success: true,
      message:
        status === "VISIT_SCHEDULED"
          ? `Enquiry #${enquiry.id} visit scheduled successfully.`
          : `Enquiry #${enquiry.id} status updated to ${enquiry.status}.`,
      enquiry: {
        id: enquiry.id,
        status: enquiry.status,
        visitDate: enquiry.visitDate,
        visitTime: enquiry.visitTime,
      },
    });
  } catch (error: any) {
    console.error("========== UPDATE ENQUIRY ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("==========================================");

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update enquiry.",
      },
      { status: 500 }
    );
  }
}