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

    const owners = await prisma.user.findMany({
      where: {
        role: { in: ["OWNER", "BROKER"] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedOwners = owners.map((owner) => ({
      id: owner.id,
      name: owner.name,
      phone: owner.phone,
      email: owner.email,
      createdAt: owner.createdAt,
      propertyCount: owner._count.properties,
    }));

    return NextResponse.json({
      success: true,
      owners: formattedOwners,
    });
  } catch (error) {
    console.error("Error fetching owners:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch owners." },
      { status: 500 }
    );
  }
}
