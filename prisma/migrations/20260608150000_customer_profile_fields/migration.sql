-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "documentId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "address" TEXT;

-- CreateIndex
CREATE INDEX "Customer_documentId_idx" ON "Customer"("documentId");
