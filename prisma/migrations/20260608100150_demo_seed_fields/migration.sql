-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "details" JSONB;

-- CreateTable
CREATE TABLE "RestaurantDemoProfile" (
    "restaurantId" TEXT NOT NULL,
    "insights" JSONB NOT NULL DEFAULT '[]',
    "orderInsights" JSONB NOT NULL DEFAULT '[]',
    "whatsapp" JSONB NOT NULL DEFAULT '{}',
    "teamActivity" JSONB NOT NULL DEFAULT '[]',
    "metricTrends" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantDemoProfile_pkey" PRIMARY KEY ("restaurantId")
);

-- AddForeignKey
ALTER TABLE "RestaurantDemoProfile" ADD CONSTRAINT "RestaurantDemoProfile_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
