-- CreateTable
CREATE TABLE "RestaurantOperatingHours" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantOperatingHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestaurantOperatingHours_restaurantId_idx" ON "RestaurantOperatingHours"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantOperatingHours_restaurantId_dayOfWeek_key" ON "RestaurantOperatingHours"("restaurantId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "RestaurantOperatingHours" ADD CONSTRAINT "RestaurantOperatingHours_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
