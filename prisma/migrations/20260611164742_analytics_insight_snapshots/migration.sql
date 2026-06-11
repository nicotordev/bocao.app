-- CreateTable
CREATE TABLE "AnalyticsInsightSnapshot" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'all',
    "status" TEXT NOT NULL DEFAULT 'all',
    "source" TEXT NOT NULL DEFAULT 'ai',
    "insights" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsInsightSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsInsightSnapshot_restaurantId_generatedAt_idx" ON "AnalyticsInsightSnapshot"("restaurantId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsInsightSnapshot_restaurantId_locale_preset_channel_key" ON "AnalyticsInsightSnapshot"("restaurantId", "locale", "preset", "channel", "status");

-- AddForeignKey
ALTER TABLE "AnalyticsInsightSnapshot" ADD CONSTRAINT "AnalyticsInsightSnapshot_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
