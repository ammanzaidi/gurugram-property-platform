import { NextResponse } from "next/server";
import { prisma, requireRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await requireRole("ADMIN");
  if (!authorization.session) {
    return NextResponse.json(
      { success: false, error: authorization.error },
      { status: authorization.status }
    );
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const [
      totalProperties,
      activeProperties,
      pendingProperties,
      rejectedProperties,
      totalLeads,
      newLeads,
      activeLeads,
      completedLeads,
      upcomingVisits,
      todaysVisits,
      completedVisits,
      totalOwners,
      totalTenants,
      recentProperties,
      recentLeads,
    ] = await prisma.$transaction([
      prisma.property.count(),
      prisma.property.count({ where: { status: "AVAILABLE" } }),
      prisma.property.count({ where: { status: "PENDING" } }),
      prisma.property.count({ where: { status: "REJECTED" } }),
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: "NEW" } }),
      prisma.enquiry.count({ where: { status: { notIn: ["CLOSED", "VISIT_COMPLETED"] } } }),
      prisma.enquiry.count({ where: { status: "VISIT_COMPLETED" } }),
      prisma.enquiry.count({ where: { visitDate: { gte: today }, status: "VISIT_SCHEDULED" } }),
      prisma.enquiry.count({ where: { visitDate: today, status: "VISIT_SCHEDULED" } }),
      prisma.enquiry.count({ where: { status: "VISIT_COMPLETED" } }),
      prisma.user.count({ where: { role: { in: ["OWNER", "BROKER"] } } }),
      prisma.user.count({ where: { role: "TENANT" } }),
      prisma.property.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, propertyType: true, bhk: true, sector: true, monthlyRent: true, status: true, createdAt: true, ownerName: true },
      }),
      prisma.enquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true, name: true, phone: true, email: true, status: true, visitDate: true, visitTime: true, createdAt: true,
          property: { select: { id: true, propertyType: true, bhk: true, sector: true, ownerName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: { totalProperties, activeProperties, pendingProperties, rejectedProperties, totalLeads, newLeads, activeLeads, completedLeads, upcomingVisits, todaysVisits, completedVisits, totalOwners, totalTenants },
      recentProperties,
      recentLeads,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD GET ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to load admin dashboard." }, { status: 500 });
  }
}
