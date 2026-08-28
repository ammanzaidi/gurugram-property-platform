import { NextResponse } from "next/server";
import { prisma, getCurrentSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ success: false, error: "Please login first." }, { status: 401 });

  try {
    const visits = await prisma.enquiry.findMany({
      where: {
        tenantId: session.userId,
        visitDate: { not: null },
      },
      orderBy: [{ visitDate: "asc" }, { visitTime: "asc" }],
      select: {
        id: true,
        status: true,
        visitDate: true,
        visitTime: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            propertyType: true,
            bhk: true,
            sector: true,
            monthlyRent: true,
            societyName: true,
            media: {
              where: { type: "IMAGE" },
              orderBy: [{ position: "asc" }, { createdAt: "asc" }],
              take: 1,
              select: { secureUrl: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, visits });
  } catch (error) {
    console.error("MY VISITS GET ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to load your visits." }, { status: 500 });
  }
}
