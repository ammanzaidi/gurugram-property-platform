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

const MAX_MEDIA_PER_PROPERTY = 10;
const MAX_IMAGES_PER_PROPERTY = 8;
const MAX_VIDEOS_PER_PROPERTY = 2;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;

const mediaTypes = {
  "image/jpeg": { type: "IMAGE", resourceType: "image" },
  "image/png": { type: "IMAGE", resourceType: "image" },
  "image/webp": { type: "IMAGE", resourceType: "image" },
  "video/mp4": { type: "VIDEO", resourceType: "video" },
  "video/quicktime": { type: "VIDEO", resourceType: "video" },
} as const;

type MediaType = (typeof mediaTypes)[keyof typeof mediaTypes];

function getUploadErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: "Unknown upload error." };
  }

  const candidate = error as {
    message?: unknown;
    name?: unknown;
    http_code?: unknown;
    code?: unknown;
  };

  return {
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    code:
      typeof candidate.http_code === "number"
        ? candidate.http_code
        : typeof candidate.code === "string"
          ? candidate.code
          : undefined,
    message:
      typeof candidate.message === "string"
        ? candidate.message
        : "Unknown upload error.",
  };
}

async function getAuthorizedProperty(propertyId: number) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return { error: "Please login first.", status: 401 as const };
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session) {
    return {
      error: "Invalid session. Please login again.",
      status: 401 as const,
    };
  }

  if (session.expiresAt < new Date()) {
    return {
      error: "Session expired. Please login again.",
      status: 401 as const,
    };
  }

  const role = session.user.role.toUpperCase();

  if (!["OWNER", "BROKER", "ADMIN"].includes(role)) {
    return {
      error: "Only owners, brokers, or administrators can manage property media.",
      status: 403 as const,
    };
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true },
  });

  if (!property) {
    return { error: "Property not found.", status: 404 as const };
  }

  if (role !== "ADMIN" && property.ownerId !== session.user.id) {
    return {
      error: "You can only manage media for your own properties.",
      status: 403 as const,
    };
  }

  return { property, session };
}

function getMediaType(file: File): MediaType | null {
  return mediaTypes[file.type as keyof typeof mediaTypes] || null;
}

function uploadToCloudinary(
  file: File,
  propertyId: number,
  mediaType: MediaType
) {
  return new Promise<{ publicId: string; secureUrl: string }>(
    async (resolve, reject) => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `gurugram-properties/${propertyId}`,
            resource_type: mediaType.resourceType,
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed."));
              return;
            }

            resolve({
              publicId: result.public_id,
              secureUrl: result.secure_url,
            });
          }
        );

        stream.end(buffer);
      } catch (error) {
        reject(error);
      }
    }
  );
}

// GET /api/properties/[id]/media
// Owners/brokers can view their own property media. Admin can view all.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const propertyId = Number(id);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID." },
        { status: 400 }
      );
    }

    const authorization = await getAuthorizedProperty(propertyId);

    if ("error" in authorization) {
      return NextResponse.json(
        { success: false, error: authorization.error },
        { status: authorization.status }
      );
    }

    const media = await prisma.propertyMedia.findMany({
      where: { propertyId },
      select: {
        id: true,
        type: true,
        secureUrl: true,
        resourceType: true,
        position: true,
        createdAt: true,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error("========== PROPERTY MEDIA GET ERROR ==========");
    console.error(error);
    console.error("==============================================");

    return NextResponse.json(
      { success: false, error: "Failed to load property media." },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/media
// Owners/brokers upload media only for their own property. Admin can upload for any property.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const uploadedMedia: {
    id: number;
    publicId: string;
    resourceType: string;
  }[] = [];

  try {
    const { id } = await params;
    const propertyId = Number(id);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID." },
        { status: 400 }
      );
    }

    const authorization = await getAuthorizedProperty(propertyId);

    if ("error" in authorization) {
      return NextResponse.json(
        { success: false, error: authorization.error },
        { status: authorization.status }
      );
    }

    const formData = await request.formData();
    const submittedFiles = formData.getAll("files");
    const files = submittedFiles.filter(
      (value): value is File => value instanceof File
    );

    if (files.length === 0 || files.length !== submittedFiles.length) {
      return NextResponse.json(
        { success: false, error: "Select at least one image or video." },
        { status: 400 }
      );
    }

    const existingMedia = await prisma.propertyMedia.findMany({
      where: { propertyId },
      select: { type: true },
    });

    const existingImages = existingMedia.filter((media) => media.type === "IMAGE").length;
    const existingVideos = existingMedia.filter((media) => media.type === "VIDEO").length;
    let uploadImages = 0;
    let uploadVideos = 0;

    for (const file of files) {
      const mediaType = getMediaType(file);

      if (!mediaType) {
        return NextResponse.json(
          {
            success: false,
            error: "Only JPG, JPEG, PNG, WEBP, MP4, and MOV files are allowed.",
          },
          { status: 400 }
        );
      }

      const maximumSize =
        mediaType.type === "IMAGE" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;

      if (file.size <= 0 || file.size > maximumSize) {
        return NextResponse.json(
          {
            success: false,
            error:
              mediaType.type === "IMAGE"
                ? "Each image must be 10 MB or smaller."
                : "Each video must be 25 MB or smaller.",
          },
          { status: 400 }
        );
      }

      if (mediaType.type === "IMAGE") uploadImages += 1;
      if (mediaType.type === "VIDEO") uploadVideos += 1;
    }

    if (
      existingMedia.length + files.length > MAX_MEDIA_PER_PROPERTY ||
      existingImages + uploadImages > MAX_IMAGES_PER_PROPERTY ||
      existingVideos + uploadVideos > MAX_VIDEOS_PER_PROPERTY
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A property can have up to 8 images, 2 videos, and 10 media items total.",
        },
        { status: 400 }
      );
    }

    let position = existingMedia.length;

    for (const file of files) {
      const mediaType = getMediaType(file);

      if (!mediaType) {
        throw new Error("Unsupported file type.");
      }

      const upload = await uploadToCloudinary(file, propertyId, mediaType);

      try {
        const media = await prisma.propertyMedia.create({
          data: {
            propertyId,
            type: mediaType.type,
            publicId: upload.publicId,
            secureUrl: upload.secureUrl,
            resourceType: mediaType.resourceType,
            position,
          },
          select: {
            id: true,
            publicId: true,
            resourceType: true,
            type: true,
            secureUrl: true,
            position: true,
            createdAt: true,
          },
        });

        uploadedMedia.push({
          id: media.id,
          publicId: media.publicId,
          resourceType: media.resourceType,
        });
        position += 1;
      } catch (error) {
        // Delete from Cloudinary with proper callback handling
        await new Promise<void>((resolve) => {
          cloudinary.uploader.destroy(
            upload.publicId,
            { resource_type: mediaType.resourceType },
            () => resolve() // Ignore Cloudinary error on cleanup
          );
        });
        throw error;
      }
    }

    const media = await prisma.propertyMedia.findMany({
      where: { id: { in: uploadedMedia.map((item) => item.id) } },
      select: {
        id: true,
        type: true,
        secureUrl: true,
        resourceType: true,
        position: true,
        createdAt: true,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ success: true, media }, { status: 201 });
  } catch (error) {
    const uploadError = getUploadErrorDetails(error);

    console.error("========== PROPERTY MEDIA UPLOAD ERROR ==========");
    console.error(uploadError);
    console.error("=================================================");

    if (uploadedMedia.length > 0) {
      await prisma.propertyMedia.deleteMany({
        where: { id: { in: uploadedMedia.map((item) => item.id) } },
      });

      // Delete from Cloudinary with proper callback handling
      await Promise.all(
        uploadedMedia.map(
          (media) =>
            new Promise<void>((resolve) => {
              cloudinary.uploader.destroy(
                media.publicId,
                { resource_type: media.resourceType },
                () => resolve() // Ignore Cloudinary error on cleanup
              );
            })
        )
      );
    }

    return NextResponse.json({
      success: false,
      error: "Failed to upload property media.",
      ...(process.env.NODE_ENV !== "production"
        ? { details: uploadError }
        : {}),
    }, { status: 500 });
  }
}
