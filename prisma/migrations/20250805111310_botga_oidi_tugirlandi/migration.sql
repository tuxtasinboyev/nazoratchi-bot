/*
  Warnings:

  - You are about to drop the column `description` on the `bot_models` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `bot_models` table. All the data in the column will be lost.
  - You are about to drop the column `previewUrl` on the `bot_models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."bot_models" DROP COLUMN "description",
DROP COLUMN "imageUrl",
DROP COLUMN "previewUrl";
