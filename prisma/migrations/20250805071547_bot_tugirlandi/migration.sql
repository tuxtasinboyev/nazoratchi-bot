/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `bot_models` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bot_models_name_key" ON "bot_models"("name");
