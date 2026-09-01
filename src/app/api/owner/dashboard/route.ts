import { NextResponse } from "next/server";
import { getCurrentSession, prisma } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ success: false, error: "Please login first." }, { status: 401 });
  if (session.user.role.toUpperCase() !== "OWNER") {
    return NextResponse.json({ success: false, error: "Owner access required." }, { status: 403 });
  }

  try {
    const ownerId = session.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const [totalProperties, activeListings, pendingReview, totalEnquiries, upcomingVisits, completedVisits, recentEnquiries] = await prisma.$transaction([
      prisma.property.count({ where: { ownerId } }),
      prisma.property.count({ where: { ownerId, status: "AVAILABLE" } }),
      prisma.property.count({ where: { ownerId, status: "PENDING" } }),
      prisma.enquiry.count({ where: { property: { is: { ownerId } } } }),
      prisma.enquiry.count({ where: { property: { is: { ownerId } }, status: "VISIT_SCHEDULED", visitDate: { gte: today } } }),
      prisma.enquiry.count({ where: { property: { is: { ownerId } }, status: "VISIT_COMPLETED" } }),
      prisma.enquiry.findMany({
        where: { property: { is: { ownerId } } }, orderBy: { createdAt: "desc" }, take: 5,
        select: { id: true, status: true, visitDate: true, visitTime: true, createdAt: true,
          property: { select: { id: true, bhk: true, propertyType: true, sector: true, societyName: true } } },
      }),
    ]);
    return NextResponse.json({ success: true, summary: { totalProperties, activeListings, pendingReview, totalEnquiries, upcomingVisits, completedVisits }, recentEnquiries });
  } catch (error) {
    console.error("OWNER DASHBOARD GET ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to load owner dashboard." }, { status: 500 });
  }
}
