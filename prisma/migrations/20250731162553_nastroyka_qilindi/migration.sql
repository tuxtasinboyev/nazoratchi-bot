/*
  Warnings:

  - You are about to drop the column `categoryId` on the `user_profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_categoryId_fkey";

-- DropIndex
DROP INDEX "user_profiles_categoryId_idx";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "categoryId";
