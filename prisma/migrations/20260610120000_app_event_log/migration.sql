-- CreateTable
CREATE TABLE "AppEventLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppEventLog_tenantId_createdAt_idx" ON "AppEventLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AppEventLog_restaurantId_createdAt_idx" ON "AppEventLog"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "AppEventLog_publishedAt_idx" ON "AppEventLog"("publishedAt");
