/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `StaffRole` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "StaffRole" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StaffRole_code_key" ON "StaffRole"("code");

-- CreateIndex
CREATE INDEX "StaffRole_code_idx" ON "StaffRole"("code");
