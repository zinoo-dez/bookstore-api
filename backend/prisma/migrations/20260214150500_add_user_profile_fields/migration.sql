-- Add richer public profile fields for author pages/settings
ALTER TABLE "User"
ADD COLUMN "pronouns" TEXT,
ADD COLUMN "shortBio" TEXT,
ADD COLUMN "about" TEXT,
ADD COLUMN "coverImage" TEXT;
