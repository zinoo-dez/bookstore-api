-- CreateEnum
CREATE TYPE "BookPurchaseFormat" AS ENUM ('PHYSICAL', 'EBOOK');

-- AlterTable
ALTER TABLE "Book"
  ADD COLUMN "ebookPrice" DECIMAL(10,2);

ALTER TABLE "CartItem"
  ADD COLUMN "format" "BookPurchaseFormat" NOT NULL DEFAULT 'PHYSICAL';

ALTER TABLE "OrderItem"
  ADD COLUMN "format" "BookPurchaseFormat" NOT NULL DEFAULT 'PHYSICAL';

-- Recreate unique index on CartItem
DROP INDEX IF EXISTS "CartItem_userId_bookId_key";
CREATE UNIQUE INDEX "CartItem_userId_bookId_format_key" ON "CartItem"("userId", "bookId", "format");
