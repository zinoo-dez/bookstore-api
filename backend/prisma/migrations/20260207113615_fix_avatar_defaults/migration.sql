/*
  Warnings:

  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
ALTER COLUMN "backgroundColor" SET DEFAULT 'bg-slate-100',
ALTER COLUMN "avatarValue" SET DEFAULT 'avatar-1';
