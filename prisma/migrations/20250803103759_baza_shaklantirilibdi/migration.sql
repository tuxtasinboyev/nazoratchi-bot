-- AlterTable
ALTER TABLE "user_bots" ADD COLUMN     "botModelId" INTEGER;

-- CreateTable
CREATE TABLE "bot_models" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "previewUrl" TEXT,
    "imageUrl" TEXT,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bot_models_categoryId_idx" ON "bot_models"("categoryId");

-- CreateIndex
CREATE INDEX "user_bots_botModelId_idx" ON "user_bots"("botModelId");

-- AddForeignKey
ALTER TABLE "bot_models" ADD CONSTRAINT "bot_models_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bots" ADD CONSTRAINT "user_bots_botModelId_fkey" FOREIGN KEY ("botModelId") REFERENCES "bot_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
