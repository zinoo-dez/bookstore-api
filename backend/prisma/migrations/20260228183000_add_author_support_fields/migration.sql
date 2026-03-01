ALTER TABLE "User"
ADD COLUMN "supportEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supportUrl" TEXT,
ADD COLUMN "supportQrImage" TEXT;
