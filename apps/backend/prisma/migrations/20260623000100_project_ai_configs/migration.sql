-- CreateEnum
CREATE TYPE "public"."AiContextLengthStrategy" AS ENUM ('COMPACT', 'BALANCED', 'EXPANDED');

-- CreateEnum
CREATE TYPE "public"."AiResultApplyStrategy" AS ENUM ('CANDIDATE', 'DIRECT_INSERT');

-- CreateTable
CREATE TABLE "public"."project_ai_configs" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "temperature" DECIMAL(3,2) NOT NULL DEFAULT 0.60,
    "max_tokens" INTEGER NOT NULL DEFAULT 2000,
    "default_continue_preset_id" INTEGER,
    "default_polish_preset_id" INTEGER,
    "default_expand_preset_id" INTEGER,
    "default_outline_preset_id" INTEGER,
    "enable_character_context" BOOLEAN NOT NULL DEFAULT true,
    "enable_system_context" BOOLEAN NOT NULL DEFAULT true,
    "enable_world_context" BOOLEAN NOT NULL DEFAULT true,
    "enable_misc_context" BOOLEAN NOT NULL DEFAULT true,
    "enable_chapter_summary_context" BOOLEAN NOT NULL DEFAULT false,
    "enable_project_memory_context" BOOLEAN NOT NULL DEFAULT false,
    "context_length_strategy" "public"."AiContextLengthStrategy" NOT NULL DEFAULT 'BALANCED',
    "result_apply_strategy" "public"."AiResultApplyStrategy" NOT NULL DEFAULT 'CANDIDATE',
    "async_task_threshold" INTEGER NOT NULL DEFAULT 3000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_ai_configs_project_id_key" ON "public"."project_ai_configs"("project_id");

-- CreateIndex
CREATE INDEX "project_ai_configs_provider_model_idx" ON "public"."project_ai_configs"("provider", "model");

-- AddForeignKey
ALTER TABLE "public"."project_ai_configs"
  ADD CONSTRAINT "project_ai_configs_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
