-- CreateTable
CREATE TABLE "InquiryQuickReplyTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "InquiryType",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryQuickReplyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InquiryQuickReplyTemplate_type_idx" ON "InquiryQuickReplyTemplate"("type");
CREATE INDEX "InquiryQuickReplyTemplate_createdByUserId_idx" ON "InquiryQuickReplyTemplate"("createdByUserId");
CREATE INDEX "InquiryQuickReplyTemplate_createdAt_idx" ON "InquiryQuickReplyTemplate"("createdAt");

-- AddForeignKey
ALTER TABLE "InquiryQuickReplyTemplate" ADD CONSTRAINT "InquiryQuickReplyTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
