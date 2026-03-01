-- CreateEnum
CREATE TYPE "EbookFormat" AS ENUM ('EPUB', 'PDF');

-- AlterTable
ALTER TABLE "Book"
  ADD COLUMN "isDigital" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ebookFormat" "EbookFormat",
  ADD COLUMN "ebookFilePath" TEXT,
  ADD COLUMN "totalPages" INTEGER;

-- CreateTable
CREATE TABLE "UserBookAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "sourceOrderId" TEXT,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserBookAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "page" INTEGER NOT NULL DEFAULT 1,
  "locationCfi" TEXT,
  "percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EbookProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookBookmark" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "page" INTEGER NOT NULL,
  "locationCfi" TEXT,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EbookBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "page" INTEGER,
  "locationCfi" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EbookNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookHighlight" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "page" INTEGER,
  "startCfi" TEXT NOT NULL,
  "endCfi" TEXT,
  "textSnippet" TEXT,
  "color" TEXT NOT NULL DEFAULT 'yellow',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EbookHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBookAccess_userId_bookId_key" ON "UserBookAccess"("userId", "bookId");
CREATE INDEX "UserBookAccess_userId_idx" ON "UserBookAccess"("userId");
CREATE INDEX "UserBookAccess_bookId_idx" ON "UserBookAccess"("bookId");
CREATE INDEX "UserBookAccess_sourceOrderId_idx" ON "UserBookAccess"("sourceOrderId");

CREATE UNIQUE INDEX "EbookProgress_userId_bookId_key" ON "EbookProgress"("userId", "bookId");
CREATE INDEX "EbookProgress_userId_updatedAt_idx" ON "EbookProgress"("userId", "updatedAt");
CREATE INDEX "EbookProgress_bookId_idx" ON "EbookProgress"("bookId");

CREATE INDEX "EbookBookmark_userId_bookId_idx" ON "EbookBookmark"("userId", "bookId");
CREATE INDEX "EbookBookmark_createdAt_idx" ON "EbookBookmark"("createdAt");

CREATE INDEX "EbookNote_userId_bookId_idx" ON "EbookNote"("userId", "bookId");
CREATE INDEX "EbookNote_updatedAt_idx" ON "EbookNote"("updatedAt");

CREATE INDEX "EbookHighlight_userId_bookId_idx" ON "EbookHighlight"("userId", "bookId");
CREATE INDEX "EbookHighlight_updatedAt_idx" ON "EbookHighlight"("updatedAt");

-- AddForeignKey
ALTER TABLE "UserBookAccess"
  ADD CONSTRAINT "UserBookAccess_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "UserBookAccess_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "UserBookAccess_sourceOrderId_fkey"
  FOREIGN KEY ("sourceOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EbookProgress"
  ADD CONSTRAINT "EbookProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EbookProgress_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EbookBookmark"
  ADD CONSTRAINT "EbookBookmark_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EbookBookmark_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EbookNote"
  ADD CONSTRAINT "EbookNote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EbookNote_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EbookHighlight"
  ADD CONSTRAINT "EbookHighlight_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EbookHighlight_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
