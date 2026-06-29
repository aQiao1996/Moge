-- Track outline-scoped AI generation records.
ALTER TABLE "ai_generation_records" ADD COLUMN "outline_id" INTEGER;

CREATE INDEX "ai_generation_records_outline_id_task_type_created_at_idx"
  ON "ai_generation_records"("outline_id", "task_type", "created_at");
