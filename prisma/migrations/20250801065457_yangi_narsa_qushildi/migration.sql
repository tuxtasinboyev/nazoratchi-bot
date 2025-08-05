/*
  Warnings:

  - Added the required column `categoryId` to the `payment_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_plans" ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
