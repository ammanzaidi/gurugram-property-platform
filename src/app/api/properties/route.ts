import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { cookies } from "next/headers";

// =========================================================
// DATABASE CONNECTION
// =========================================================
// SQLite database ke saath Prisma ko connect kar rahe hain.
// DATABASE_URL .env file se aayega.
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

// Prisma Client database ke saath communication handle karta hai.
const prisma = new PrismaClient({
  adapter,
});

// =========================================================
// POST /api/properties
// =========================================================
// Owner/Broker form submit karta hai to ye function chalega.
//
// Flow:
// List Property Form
//       ↓
// POST /api/properties
//       ↓
// Prisma
//       ↓
// SQLite Database
// =========================================================
export async function POST(request: Request) {
  try {
    // Only an authenticated owner, broker, or administrator can submit a listing.
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

    const session = await prisma.session.findUnique({
      where: {
        token: sessionToken,
      },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired session. Please login again.",
        },
        { status: 401 }
      );
    }

    const role = session.user.role.toUpperCase();

    if (!["OWNER", "BROKER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only owners, brokers, or administrators can list properties.",
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------
    // FORM DATA RECEIVE KARNA
    // -------------------------------------------------------
    const data = await request.json();

    // -------------------------------------------------------
    // PROPERTY DATABASE MEIN SAVE KARNA
    // -------------------------------------------------------
    const property = await prisma.property.create({
      data: {
        // The listing owner is always the authenticated account, never request data.
        ownerId: session.user.id,

        // ---------------------------------------------------
        // BASIC PROPERTY DETAILS
        // ---------------------------------------------------
        propertyType: data.propertyType,
        bhk: data.bhk,
        sector: data.sector,

        // Monthly rent ko number mein convert karna.
        monthlyRent: Number(data.monthlyRent),

        // ---------------------------------------------------
        // FURNISHING DETAILS
        // ---------------------------------------------------
        furnishing: data.furnishing,

        // Example:
        // AC, Bed, Sofa, Geyser, Wardrobe etc.
        furnishingDetails: data.furnishingDetails || null,

        // ---------------------------------------------------
        // PROPERTY FEATURES
        // ---------------------------------------------------
        // Property ka total area square feet mein.
        areaSqFt: Number(data.areaSqFt),

        // Vastu information.
        vastu: data.vastu || null,

        // Property available hone ki date.
        availableFrom: data.availableFrom,

        // ---------------------------------------------------
        // LOCATION INFORMATION
        // ---------------------------------------------------
        // Society name tenant ko public page par dikhaya ja sakta hai.
        societyName: data.societyName,

        // Exact address database mein private rahega.
        // Public API response mein ise nahi bhejenge.
        address: data.address,

        // Property description.
        description: data.description || null,

        // ---------------------------------------------------
        // OWNER / BROKER PRIVATE INFORMATION
        // ---------------------------------------------------
        // Identity must come from the authenticated account, not the request body.
        // These fields are never exposed by the public listing API.
        ownerName: session.user.name,
        ownerPhone: session.user.phone,
        ownerEmail: session.user.email || "",

        // Listings require business review before becoming public.
        status: "PENDING",
      },
    });

    console.log("Property created:", property);

    // -------------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------------
    return NextResponse.json(
  {
    success: true,
    property: {
      id: property.id,
      propertyType: property.propertyType,
      bhk: property.bhk,
      sector: property.sector,
      monthlyRent: property.monthlyRent,
      furnishing: property.furnishing,
      furnishingDetails: property.furnishingDetails,
      areaSqFt: property.areaSqFt,
      vastu: property.vastu,
      availableFrom: property.availableFrom,
      societyName: property.societyName,
      description: property.description,
      createdAt: property.createdAt,
    },
  },
  { status: 201 }
);
  } catch (error: any) {
    // -------------------------------------------------------
    // ERROR HANDLING
    // -------------------------------------------------------
    // Agar database mein problem aaye to terminal mein
    // detailed error show hoga.
    console.error("========== PROPERTY CREATION ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Meta:", error?.meta);
    console.error("=============================================");

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to save property",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// GET /api/properties
// =========================================================
// Ye public property listings ke liye use hoga.
//
// IMPORTANT SECURITY RULE:
//
// Tenant ko sirf public information bhejni hai.
//
// PUBLIC:
// ✅ Property type
// ✅ BHK
// ✅ Sector
// ✅ Rent
// ✅ Furnishing
// ✅ Furnishing details
// ✅ Area
// ✅ Vastu
// ✅ Available From
// ✅ Society Name
// ✅ Description
//
// PRIVATE:
// ❌ Exact address
// ❌ House/Flat number
// ❌ Owner name
// ❌ Owner phone
// ❌ Owner email
// =========================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const location = searchParams.get("location")?.trim() || "";
    const propertyType = searchParams.get("propertyType")?.trim() || "";
    const budget = searchParams.get("budget")?.trim() || "";

    // =====================================================
    // BUILD SEARCH FILTER
    // =====================================================

    const where: any = {
      status: "AVAILABLE",
    };

    // Location search
    // Example: Sector 67
    if (location) {
  const normalizedLocation = location
    .replace(/^sector\s*/i, "")
    .replace(/,\s*gurugram$/i, "")
    .trim();

  if (normalizedLocation) {
    where.sector = {
      contains: normalizedLocation,
    };
  }
}

    // Property type filter
    if (propertyType && propertyType !== "Any Property") {
      where.propertyType = propertyType;
    }

    // Budget filter
    switch (budget) {
      case "Below ₹20K":
        where.monthlyRent = {
          lt: 20000,
        };
        break;

      case "₹20K - ₹30K":
        where.monthlyRent = {
          gte: 20000,
          lte: 30000,
        };
        break;

      case "₹30K - ₹40K":
        where.monthlyRent = {
          gte: 30000,
          lte: 40000,
        };
        break;

      case "₹40K - ₹50K":
        where.monthlyRent = {
          gte: 40000,
          lte: 50000,
        };
        break;

      case "₹50K+":
        where.monthlyRent = {
          gte: 50000,
        };
        break;
    }

    console.log("Property search:", {
      location,
      propertyType,
      budget,
    });

    console.log("Prisma filter:", where);

    // =====================================================
    // FETCH PROPERTIES
    // =====================================================

    const properties = await prisma.property.findMany({
      where,

      select: {
        id: true,
        propertyType: true,
        bhk: true,
        sector: true,
        monthlyRent: true,

        furnishing: true,
        furnishingDetails: true,

        areaSqFt: true,
        vastu: true,

        availableFrom: true,

        societyName: true,
        description: true,
        media: {
          select: {
            id: true,
            type: true,
            secureUrl: true,
            position: true,
          },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },

        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // =====================================================
    // SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,
      properties,
    });

  } catch (error: any) {

    console.error("========== PROPERTY SEARCH ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Meta:", error?.meta);
    console.error("==========================================");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search properties",
      },
      { status: 500 }
    );
  }
}
