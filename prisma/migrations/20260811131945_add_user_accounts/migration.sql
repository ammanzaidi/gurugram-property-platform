-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER,
    "propertyType" TEXT NOT NULL,
    "bhk" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "monthlyRent" INTEGER NOT NULL,
    "furnishing" TEXT NOT NULL,
    "furnishingDetails" TEXT,
    "availableFrom" TEXT NOT NULL,
    "areaSqFt" INTEGER NOT NULL DEFAULT 0,
    "vastu" TEXT,
    "societyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "areaSqFt", "availableFrom", "bhk", "createdAt", "description", "furnishing", "furnishingDetails", "id", "monthlyRent", "ownerEmail", "ownerName", "ownerPhone", "propertyType", "sector", "societyName", "status", "vastu") SELECT "address", "areaSqFt", "availableFrom", "bhk", "createdAt", "description", "furnishing", "furnishingDetails", "id", "monthlyRent", "ownerEmail", "ownerName", "ownerPhone", "propertyType", "sector", "societyName", "status", "vastu" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
