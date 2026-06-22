-- CreateEnum
CREATE TYPE "public"."DictScope" AS ENUM ('SYSTEM', 'USER', 'PROJECT');

-- CreateEnum
CREATE TYPE "public"."DictShareStatus" AS ENUM ('PRIVATE', 'SHARED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."dict_items"
  ADD COLUMN "scope" "public"."DictScope" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "user_id" INTEGER,
  ADD COLUMN "project_id" INTEGER,
  ADD COLUMN "share_status" "public"."DictShareStatus" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "source_item_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."dict_item_versions" (
    "id" SERIAL NOT NULL,
    "dict_item_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dict_item_versions_pkey" PRIMARY KEY ("id")
);

-- Drop old global uniqueness. Scoped uniqueness is enforced by partial indexes below.
DROP INDEX IF EXISTS "public"."dict_items_category_code_value_key";

-- CreateIndex
CREATE INDEX "dict_items_category_code_scope_user_id_project_id_idx"
  ON "public"."dict_items"("category_code", "scope", "user_id", "project_id");

-- CreateIndex
CREATE INDEX "dict_items_share_status_idx" ON "public"."dict_items"("share_status");

-- CreateIndex
CREATE INDEX "dict_item_versions_dict_item_id_version_idx"
  ON "public"."dict_item_versions"("dict_item_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "dict_item_versions_dict_item_id_version_key"
  ON "public"."dict_item_versions"("dict_item_id", "version");

-- Partial unique indexes avoid PostgreSQL NULL uniqueness gaps.
CREATE UNIQUE INDEX "dict_items_system_category_value_key"
  ON "public"."dict_items"("category_code", "value")
  WHERE "scope" = 'SYSTEM';

CREATE UNIQUE INDEX "dict_items_user_category_value_key"
  ON "public"."dict_items"("category_code", "value", "user_id")
  WHERE "scope" = 'USER' AND "user_id" IS NOT NULL;

CREATE UNIQUE INDEX "dict_items_project_category_value_key"
  ON "public"."dict_items"("category_code", "value", "project_id")
  WHERE "scope" = 'PROJECT' AND "project_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."dict_items"
  ADD CONSTRAINT "dict_items_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dict_items"
  ADD CONSTRAINT "dict_items_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dict_item_versions"
  ADD CONSTRAINT "dict_item_versions_dict_item_id_fkey"
  FOREIGN KEY ("dict_item_id") REFERENCES "public"."dict_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
