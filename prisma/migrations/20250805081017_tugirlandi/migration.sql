/*
  Warnings:

  - You are about to drop the column `botModelId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `botName` on the `payments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_botModelId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "botModelId",
DROP COLUMN "botName";
