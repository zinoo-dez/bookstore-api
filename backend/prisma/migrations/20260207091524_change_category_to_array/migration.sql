/*
  Warnings:

  - You are about to drop the column `category` on the `Book` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Book_category_idx";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "category",
ADD COLUMN     "categories" TEXT[];
