import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { cookies } from "next/headers";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id, mediaId } = await params;
    const propertyId = Number(id);
    const propertyMediaId = Number(mediaId);

    if (
      !Number.isInteger(propertyId) ||
      propertyId <= 0 ||
      !Number.isInteger(propertyMediaId) ||
      propertyMediaId <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid property or media ID." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Please login first." },
        { status: 401 }
      );
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
      return NextResponse.json(
        { success: false, error: "Access denied." },
        { status: 403 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found." },
        { status: 404 }
      );
    }

    if (role !== "ADMIN" && property.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You can only manage media for your own properties." },
        { status: 403 }
      );
    }

    const media = await prisma.propertyMedia.findFirst({
      where: { id: propertyMediaId, propertyId },
    });

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found." },
        { status: 404 }
      );
    }

    // Delete from Cloudinary with proper callback handling
    await new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(
        media.publicId,
        { resource_type: media.resourceType },
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });

    await prisma.propertyMedia.delete({
      where: { id: media.id },
    });

    return NextResponse.json({
      success: true,
      message: "Property media deleted successfully.",
    });
  } catch (error) {
    console.error("========== PROPERTY MEDIA DELETE ERROR ==========");
    console.error(error);
    console.error("=================================================");

    return NextResponse.json(
      { success: false, error: "Failed to delete property media." },
      { status: 500 }
    );
  }
}
