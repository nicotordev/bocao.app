-- CreateEnum
CREATE TYPE "KitchenStationCategory" AS ENUM ('GRILL', 'FRYER', 'SUSHI', 'BAR', 'DESSERTS', 'DELIVERY', 'PREP', 'OTHER');

-- CreateTable
CREATE TABLE "KitchenStation" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" "KitchenStationCategory" NOT NULL,
    "imageUrl" TEXT,
    "iconId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenStation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KitchenStation_restaurantId_idx" ON "KitchenStation"("restaurantId");

-- CreateIndex
CREATE INDEX "KitchenStation_restaurantId_sortOrder_idx" ON "KitchenStation"("restaurantId", "sortOrder");

-- AddForeignKey
ALTER TABLE "KitchenStation" ADD CONSTRAINT "KitchenStation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
