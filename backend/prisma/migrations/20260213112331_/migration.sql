-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('order', 'payment', 'legal', 'author', 'stock', 'other');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InquiryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InquirySenderType" AS ENUM ('USER', 'STAFF');

-- CreateEnum
CREATE TYPE "InquiryAuditAction" AS ENUM ('CREATED', 'ASSIGNED', 'ESCALATED', 'STATUS_CHANGED', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'inquiry_created';
ALTER TYPE "NotificationType" ADD VALUE 'inquiry_assigned';
ALTER TYPE "NotificationType" ADD VALUE 'inquiry_escalated';
ALTER TYPE "NotificationType" ADD VALUE 'inquiry_reply';

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "type" "InquiryType" NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "InquiryPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdByUserId" TEXT NOT NULL,
    "assignedToStaffId" TEXT,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryMessage" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "InquirySenderType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryInternalNote" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryAudit" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "action" "InquiryAuditAction" NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT,
    "performedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_departmentId_idx" ON "Inquiry"("departmentId");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_createdByUserId_idx" ON "Inquiry"("createdByUserId");

-- CreateIndex
CREATE INDEX "Inquiry_assignedToStaffId_idx" ON "Inquiry"("assignedToStaffId");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "InquiryMessage_inquiryId_idx" ON "InquiryMessage"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryMessage_createdAt_idx" ON "InquiryMessage"("createdAt");

-- CreateIndex
CREATE INDEX "InquiryInternalNote_inquiryId_idx" ON "InquiryInternalNote"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryInternalNote_staffId_idx" ON "InquiryInternalNote"("staffId");

-- CreateIndex
CREATE INDEX "InquiryInternalNote_createdAt_idx" ON "InquiryInternalNote"("createdAt");

-- CreateIndex
CREATE INDEX "InquiryAudit_inquiryId_idx" ON "InquiryAudit"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryAudit_createdAt_idx" ON "InquiryAudit"("createdAt");

-- CreateIndex
CREATE INDEX "InquiryAudit_performedByUserId_idx" ON "InquiryAudit"("performedByUserId");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assignedToStaffId_fkey" FOREIGN KEY ("assignedToStaffId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryInternalNote" ADD CONSTRAINT "InquiryInternalNote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryInternalNote" ADD CONSTRAINT "InquiryInternalNote_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryAudit" ADD CONSTRAINT "InquiryAudit_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryAudit" ADD CONSTRAINT "InquiryAudit_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
