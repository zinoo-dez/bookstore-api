-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[];
