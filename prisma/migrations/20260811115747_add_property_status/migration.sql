-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Property" ("address", "areaSqFt", "availableFrom", "bhk", "createdAt", "description", "furnishing", "furnishingDetails", "id", "monthlyRent", "ownerEmail", "ownerName", "ownerPhone", "propertyType", "sector", "societyName", "vastu") SELECT "address", "areaSqFt", "availableFrom", "bhk", "createdAt", "description", "furnishing", "furnishingDetails", "id", "monthlyRent", "ownerEmail", "ownerName", "ownerPhone", "propertyType", "sector", "societyName", "vastu" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
