-- CreateTable
CREATE TABLE "RestaurantWhatsAppConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "displayPhoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantWhatsAppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantWhatsAppConfig_restaurantId_key" ON "RestaurantWhatsAppConfig"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantWhatsAppConfig_phoneNumberId_key" ON "RestaurantWhatsAppConfig"("phoneNumberId");

-- CreateIndex
CREATE INDEX "RestaurantWhatsAppConfig_organizationId_idx" ON "RestaurantWhatsAppConfig"("organizationId");

-- AddForeignKey
ALTER TABLE "RestaurantWhatsAppConfig" ADD CONSTRAINT "RestaurantWhatsAppConfig_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
