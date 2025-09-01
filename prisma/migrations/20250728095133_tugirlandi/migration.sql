/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerUserId]` on the table `OAuthAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "OAuthAccount_provider_providerUserId_idx" ON "OAuthAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerUserId_key" ON "OAuthAccount"("provider", "providerUserId");
