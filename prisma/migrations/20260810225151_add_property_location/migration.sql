/*
  Warnings:

  - Added the required column `address` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `societyName` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
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
    "availableFrom" TEXT NOT NULL,
    "societyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Property" ("availableFrom", "bhk", "createdAt", "description", "furnishing", "id", "monthlyRent", "ownerEmail", "ownerName", "ownerPhone", "propertyType", "sector") SELECT "availableFrom", "bhk", "createdAt", "description", "furnishing", "id", "monthlyRent", "ownerEmail", "ownerName", "ownerPhone", "propertyType", "sector" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
