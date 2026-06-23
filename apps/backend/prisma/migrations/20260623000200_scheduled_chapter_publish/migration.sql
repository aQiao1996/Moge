-- AlterEnum
ALTER TYPE "public"."ChapterStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';

-- AlterTable
ALTER TABLE "public"."manuscript_chapter"
  ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "manuscript_chapter_scheduled_at_idx"
  ON "public"."manuscript_chapter"("scheduled_at");
