-- CreateTable
CREATE TABLE "CustomerSmartSegmentSnapshot" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "segments" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSmartSegmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSmartSegmentSnapshot_restaurantId_generatedAt_idx" ON "CustomerSmartSegmentSnapshot"("restaurantId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSmartSegmentSnapshot_restaurantId_locale_key" ON "CustomerSmartSegmentSnapshot"("restaurantId", "locale");

-- AddForeignKey
ALTER TABLE "CustomerSmartSegmentSnapshot" ADD CONSTRAINT "CustomerSmartSegmentSnapshot_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
