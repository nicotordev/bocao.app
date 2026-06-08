-- CreateEnum
CREATE TYPE "DiningTableShape" AS ENUM ('ROUND', 'SQUARE', 'RECT');

-- CreateTable
CREATE TABLE "DiningSurface" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Salón principal',
    "surfaceAreaM2" DOUBLE PRECISION NOT NULL,
    "boundary" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningSurface_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTable" (
    "id" TEXT NOT NULL,
    "surfaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "shape" "DiningTableShape" NOT NULL DEFAULT 'ROUND',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiningSurface_restaurantId_idx" ON "DiningSurface"("restaurantId");

-- CreateIndex
CREATE INDEX "DiningTable_surfaceId_idx" ON "DiningTable"("surfaceId");

-- CreateIndex
CREATE UNIQUE INDEX "DiningTable_surfaceId_number_key" ON "DiningTable"("surfaceId", "number");

-- AddForeignKey
ALTER TABLE "DiningSurface" ADD CONSTRAINT "DiningSurface_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_surfaceId_fkey" FOREIGN KEY ("surfaceId") REFERENCES "DiningSurface"("id") ON DELETE CASCADE ON UPDATE CASCADE;
