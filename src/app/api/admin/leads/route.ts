import { NextResponse } from "next/server";
import { getCurrentSession, prisma } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Please login first." },
        { status: 401 }
      );
    }

    if (session.user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin access required." },
        { status: 403 }
      );
    }

    const leads = await prisma.enquiry.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        visitDate: true,
        visitTime: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            bhk: true,
            propertyType: true,
            sector: true,
            monthlyRent: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      leads,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads." },
      { status: 500 }
    );
  }
}
