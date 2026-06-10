-- CreateTable
CREATE TABLE "CustomerSavedSegment" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSavedSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSavedSegmentMember" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSavedSegmentMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSavedSegment_restaurantId_idx" ON "CustomerSavedSegment"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSavedSegment_restaurantId_name_key" ON "CustomerSavedSegment"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "CustomerSavedSegmentMember_customerId_idx" ON "CustomerSavedSegmentMember"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSavedSegmentMember_segmentId_idx" ON "CustomerSavedSegmentMember"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSavedSegmentMember_segmentId_customerId_key" ON "CustomerSavedSegmentMember"("segmentId", "customerId");

-- AddForeignKey
ALTER TABLE "CustomerSavedSegment" ADD CONSTRAINT "CustomerSavedSegment_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSavedSegmentMember" ADD CONSTRAINT "CustomerSavedSegmentMember_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "CustomerSavedSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSavedSegmentMember" ADD CONSTRAINT "CustomerSavedSegmentMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
