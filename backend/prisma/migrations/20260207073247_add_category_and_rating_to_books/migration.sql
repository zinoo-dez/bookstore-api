-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "category" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0;

-- CreateIndex
CREATE INDEX "Book_category_idx" ON "Book"("category");
