-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('TO_READ', 'READING', 'FINISHED');

-- CreateTable
CREATE TABLE "ReadingItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'TO_READ',
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER,
    "dailyGoalPages" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingItem_userId_idx" ON "ReadingItem"("userId");

-- CreateIndex
CREATE INDEX "ReadingItem_status_idx" ON "ReadingItem"("status");

-- CreateIndex
CREATE INDEX "ReadingItem_updatedAt_idx" ON "ReadingItem"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingItem_userId_bookId_key" ON "ReadingItem"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "ReadingItem" ADD CONSTRAINT "ReadingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingItem" ADD CONSTRAINT "ReadingItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
