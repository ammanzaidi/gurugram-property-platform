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

    const tenants = await prisma.user.findMany({
      where: {
        role: "TENANT",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            enquiries: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedTenants = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      createdAt: tenant.createdAt,
      enquiryCount: tenant._count.enquiries,
    }));

    return NextResponse.json({
      success: true,
      tenants: formattedTenants,
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenants." },
      { status: 500 }
    );
  }
}
