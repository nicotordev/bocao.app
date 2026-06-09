-- CreateEnum
CREATE TYPE "ProductFlowBlockType" AS ENUM ('CHOICE', 'MULTI_CHOICE', 'QUANTITY', 'TEXT', 'INFO', 'UPSELL');

-- CreateTable
CREATE TABLE "ProductFlowBlock" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "ProductFlowBlockType" NOT NULL,
    "config" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFlowBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFlowTemplate" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFlowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPurchaseFlow" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPurchaseFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductFlowBlock_restaurantId_idx" ON "ProductFlowBlock"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFlowBlock_restaurantId_key_key" ON "ProductFlowBlock"("restaurantId", "key");

-- CreateIndex
CREATE INDEX "ProductFlowTemplate_restaurantId_idx" ON "ProductFlowTemplate"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPurchaseFlow_menuItemId_key" ON "ProductPurchaseFlow"("menuItemId");

-- CreateIndex
CREATE INDEX "ProductPurchaseFlow_restaurantId_idx" ON "ProductPurchaseFlow"("restaurantId");

-- AddForeignKey
ALTER TABLE "ProductFlowBlock" ADD CONSTRAINT "ProductFlowBlock_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFlowTemplate" ADD CONSTRAINT "ProductFlowTemplate_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchaseFlow" ADD CONSTRAINT "ProductPurchaseFlow_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchaseFlow" ADD CONSTRAINT "ProductPurchaseFlow_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
