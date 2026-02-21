ALTER TABLE "Order"
ADD COLUMN "subtotalPrice" DECIMAL(10,2),
ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "promoCode" TEXT;

UPDATE "Order"
SET "subtotalPrice" = "totalPrice"
WHERE "subtotalPrice" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "subtotalPrice" SET NOT NULL;

CREATE INDEX "Order_promoCode_idx" ON "Order"("promoCode");
