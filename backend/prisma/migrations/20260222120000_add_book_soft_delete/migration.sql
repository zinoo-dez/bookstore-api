-- Add soft-delete support for books
ALTER TABLE "Book" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Book_deletedAt_idx" ON "Book"("deletedAt");
