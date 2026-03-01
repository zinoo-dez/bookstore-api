-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('HOME_DELIVERY', 'STORE_PICKUP');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreStock" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreTransfer" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toStoreId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreTransfer_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryType" "DeliveryType" NOT NULL DEFAULT 'HOME_DELIVERY',
ADD COLUMN "storeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");
CREATE UNIQUE INDEX "StoreStock_storeId_bookId_key" ON "StoreStock"("storeId", "bookId");

CREATE INDEX "Store_name_idx" ON "Store"("name");
CREATE INDEX "Store_city_idx" ON "Store"("city");
CREATE INDEX "Store_state_idx" ON "Store"("state");
CREATE INDEX "Store_isActive_idx" ON "Store"("isActive");

CREATE INDEX "StoreStock_storeId_idx" ON "StoreStock"("storeId");
CREATE INDEX "StoreStock_bookId_idx" ON "StoreStock"("bookId");

CREATE INDEX "StoreTransfer_bookId_idx" ON "StoreTransfer"("bookId");
CREATE INDEX "StoreTransfer_fromWarehouseId_idx" ON "StoreTransfer"("fromWarehouseId");
CREATE INDEX "StoreTransfer_toStoreId_idx" ON "StoreTransfer"("toStoreId");
CREATE INDEX "StoreTransfer_createdAt_idx" ON "StoreTransfer"("createdAt");

CREATE INDEX "Order_deliveryType_idx" ON "Order"("deliveryType");
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoreStock" ADD CONSTRAINT "StoreStock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreStock" ADD CONSTRAINT "StoreStock_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoreTransfer" ADD CONSTRAINT "StoreTransfer_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreTransfer" ADD CONSTRAINT "StoreTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreTransfer" ADD CONSTRAINT "StoreTransfer_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
