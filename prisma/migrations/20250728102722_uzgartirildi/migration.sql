-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_categoryId_fkey";

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
