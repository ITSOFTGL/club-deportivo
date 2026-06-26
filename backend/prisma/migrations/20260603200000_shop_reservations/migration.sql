-- AlterEnum: add RESERVED and READY to OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reservationExpiresAt" TIMESTAMP(3);
