/*
  Warnings:

  - The `paymentGateway` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('PAYME', 'CLICK', 'CASH');

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "paymentGateway",
ADD COLUMN     "paymentGateway" "PaymentGateway" NOT NULL DEFAULT 'CASH';
