-- CreateTable
CREATE TABLE "MenuCustomTag" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCustomTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbTranslation" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DbTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuCustomTag_restaurantId_idx" ON "MenuCustomTag"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCustomTag_restaurantId_key_key" ON "MenuCustomTag"("restaurantId", "key");

-- CreateIndex
CREATE INDEX "DbTranslation_restaurantId_entityType_idx" ON "DbTranslation"("restaurantId", "entityType");

-- CreateIndex
CREATE INDEX "DbTranslation_restaurantId_entityType_entityKey_idx" ON "DbTranslation"("restaurantId", "entityType", "entityKey");

-- CreateIndex
CREATE UNIQUE INDEX "DbTranslation_restaurantId_entityType_entityKey_locale_field_key" ON "DbTranslation"("restaurantId", "entityType", "entityKey", "locale", "field");

-- AddForeignKey
ALTER TABLE "MenuCustomTag" ADD CONSTRAINT "MenuCustomTag_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DbTranslation" ADD CONSTRAINT "DbTranslation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
