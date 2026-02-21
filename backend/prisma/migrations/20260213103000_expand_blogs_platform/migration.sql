-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'blog_like';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'blog_comment';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'blog_follow';

-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "AuthorBlog"
  ADD COLUMN "subtitle" TEXT,
  ADD COLUMN "coverImage" TEXT,
  ADD COLUMN "readingTime" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "viewsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "likesCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "commentsCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing posts to published and accurate comment counts
UPDATE "AuthorBlog" b
SET "status" = 'PUBLISHED',
    "commentsCount" = COALESCE(c.count, 0)
FROM (
  SELECT "blogId", COUNT(*)::int AS count
  FROM "BlogComment"
  GROUP BY "blogId"
) c
WHERE b."id" = c."blogId";

UPDATE "AuthorBlog"
SET "status" = 'PUBLISHED'
WHERE "status" = 'DRAFT';

-- CreateTable
CREATE TABLE "BlogLike" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlogLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogTag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTag" (
  "postId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,

  CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("postId", "tagId")
);

-- CreateTable
CREATE TABLE "BlogPostBookReference" (
  "postId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,

  CONSTRAINT "BlogPostBookReference_pkey" PRIMARY KEY ("postId", "bookId")
);

-- CreateIndex
CREATE INDEX "AuthorBlog_status_idx" ON "AuthorBlog"("status");
CREATE INDEX "AuthorBlog_viewsCount_idx" ON "AuthorBlog"("viewsCount");
CREATE INDEX "AuthorBlog_likesCount_idx" ON "AuthorBlog"("likesCount");

CREATE UNIQUE INDEX "BlogLike_postId_userId_key" ON "BlogLike"("postId", "userId");
CREATE INDEX "BlogLike_postId_idx" ON "BlogLike"("postId");
CREATE INDEX "BlogLike_userId_idx" ON "BlogLike"("userId");
CREATE INDEX "BlogLike_createdAt_idx" ON "BlogLike"("createdAt");

CREATE UNIQUE INDEX "BlogTag_name_key" ON "BlogTag"("name");
CREATE INDEX "BlogTag_name_idx" ON "BlogTag"("name");

CREATE INDEX "BlogPostTag_tagId_idx" ON "BlogPostTag"("tagId");
CREATE INDEX "BlogPostBookReference_bookId_idx" ON "BlogPostBookReference"("bookId");

-- AddForeignKey
ALTER TABLE "BlogLike"
  ADD CONSTRAINT "BlogLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AuthorBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BlogLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogPostTag"
  ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AuthorBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogPostBookReference"
  ADD CONSTRAINT "BlogPostBookReference_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AuthorBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BlogPostBookReference_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
