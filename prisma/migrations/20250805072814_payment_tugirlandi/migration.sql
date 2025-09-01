/*
  Warnings:

  - Added the required column `botModelId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `botName` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "botModelId" INTEGER NOT NULL,
ADD COLUMN     "botName" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_botModelId_fkey" FOREIGN KEY ("botModelId") REFERENCES "bot_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
