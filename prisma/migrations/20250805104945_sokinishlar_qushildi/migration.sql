-- CreateTable
CREATE TABLE "public"."bad_words" (
    "id" SERIAL NOT NULL,
    "uzbek" TEXT NOT NULL,
    "russian" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bad_words_pkey" PRIMARY KEY ("id")
);
