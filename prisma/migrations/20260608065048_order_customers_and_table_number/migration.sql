-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "customerId",
ADD COLUMN     "tableNumber" TEXT;

-- CreateTable
CREATE TABLE "OrderCustomer" (
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCustomer_pkey" PRIMARY KEY ("orderId","customerId")
);

-- CreateIndex
CREATE INDEX "OrderCustomer_customerId_idx" ON "OrderCustomer"("customerId");

-- AddForeignKey
ALTER TABLE "OrderCustomer" ADD CONSTRAINT "OrderCustomer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCustomer" ADD CONSTRAINT "OrderCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
