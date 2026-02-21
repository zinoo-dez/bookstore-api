-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "paymentReceiptUrl" TEXT;
