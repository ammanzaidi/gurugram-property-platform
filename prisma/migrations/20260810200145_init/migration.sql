-- CreateTable
CREATE TABLE "Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyType" TEXT NOT NULL,
    "bhk" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "monthlyRent" INTEGER NOT NULL,
    "furnishing" TEXT NOT NULL,
    "availableFrom" TEXT NOT NULL,
    "description" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
