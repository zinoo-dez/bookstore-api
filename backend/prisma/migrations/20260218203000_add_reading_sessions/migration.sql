-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "readingItemId" TEXT,
    "pagesRead" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingSession_userId_sessionDate_idx" ON "ReadingSession"("userId", "sessionDate");

-- CreateIndex
CREATE INDEX "ReadingSession_bookId_sessionDate_idx" ON "ReadingSession"("bookId", "sessionDate");

-- CreateIndex
CREATE INDEX "ReadingSession_readingItemId_idx" ON "ReadingSession"("readingItemId");

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_readingItemId_fkey" FOREIGN KEY ("readingItemId") REFERENCES "ReadingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
