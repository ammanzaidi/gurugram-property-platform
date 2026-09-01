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

    // Get all enquiries with visit data
    const visits = await prisma.enquiry.findMany({
      where: {
        visitDate: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        visitDate: true,
        visitTime: true,
        property: {
          select: {
            id: true,
            bhk: true,
            propertyType: true,
            sector: true,
            monthlyRent: true,
            ownerName: true,
            ownerPhone: true,
          },
        },
      },
      orderBy: {
        visitDate: "desc",
      },
    });

    // Format the response
    const formattedVisits = visits.map((visit) => ({
      id: visit.id,
      visitDate: visit.visitDate,
      visitTime: visit.visitTime,
      status: visit.status,
      tenantName: visit.name,
      tenantPhone: visit.phone,
      ownerName: visit.property.ownerName,
      ownerPhone: visit.property.ownerPhone,
      property: {
        id: visit.property.id,
        bhk: visit.property.bhk,
        propertyType: visit.property.propertyType,
        sector: visit.property.sector,
        monthlyRent: visit.property.monthlyRent,
      },
    }));

    return NextResponse.json({
      success: true,
      visits: formattedVisits,
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch visits." },
      { status: 500 }
    );
  }
}
