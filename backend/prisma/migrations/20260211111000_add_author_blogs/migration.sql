-- CreateTable
CREATE TABLE "AuthorBlog" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorBlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthorBlog_authorId_idx" ON "AuthorBlog"("authorId");

-- CreateIndex
CREATE INDEX "AuthorBlog_createdAt_idx" ON "AuthorBlog"("createdAt");

-- CreateIndex
CREATE INDEX "AuthorFollow_followerId_idx" ON "AuthorFollow"("followerId");

-- CreateIndex
CREATE INDEX "AuthorFollow_authorId_idx" ON "AuthorFollow"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorFollow_followerId_authorId_key" ON "AuthorFollow"("followerId", "authorId");

-- CreateIndex
CREATE INDEX "BlogComment_blogId_idx" ON "BlogComment"("blogId");

-- CreateIndex
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");

-- CreateIndex
CREATE INDEX "BlogComment_createdAt_idx" ON "BlogComment"("createdAt");

-- CreateIndex
CREATE INDEX "BlogNotification_userId_idx" ON "BlogNotification"("userId");

-- CreateIndex
CREATE INDEX "BlogNotification_createdAt_idx" ON "BlogNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "AuthorBlog" ADD CONSTRAINT "AuthorBlog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorFollow" ADD CONSTRAINT "AuthorFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorFollow" ADD CONSTRAINT "AuthorFollow_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "AuthorBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogNotification" ADD CONSTRAINT "BlogNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
