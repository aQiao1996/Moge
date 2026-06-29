-- Add optional project ownership context for outlines.
ALTER TABLE "outline" ADD COLUMN "project_id" INTEGER;

ALTER TABLE "outline"
  ADD CONSTRAINT "outline_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "outline_project_id_idx" ON "outline"("project_id");
