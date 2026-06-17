-- CreateEnum
CREATE TYPE "public"."OutlineStatus" AS ENUM ('DRAFT', 'GENERATING', 'GENERATED', 'PUBLISHED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "public"."ManuscriptStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'PUBLISHED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."ChapterStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "public"."dict_categories" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dict_items" (
    "id" SERIAL NOT NULL,
    "category_code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outline" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "era" TEXT,
    "conflict" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remark" TEXT,
    "status" "public"."OutlineStatus" NOT NULL DEFAULT 'DRAFT',
    "characters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "systems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "worlds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "misc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outline_content" (
    "id" SERIAL NOT NULL,
    "outline_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outline_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outline_volume" (
    "id" SERIAL NOT NULL,
    "outline_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" DECIMAL(10,5) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outline_volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outline_chapter" (
    "id" SERIAL NOT NULL,
    "outline_id" INTEGER,
    "volume_id" INTEGER,
    "title" TEXT NOT NULL,
    "sort_order" DECIMAL(10,5) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outline_chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outline_chapter_content" (
    "id" SERIAL NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outline_chapter_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outline_chapter_content_version" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outline_chapter_content_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outline_content_version" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outline_content_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "characters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "systems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "worlds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "misc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."character_settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER,
    "gender" INTEGER,
    "age" TEXT,
    "height" TEXT,
    "appearance" TEXT,
    "personality" TEXT,
    "background" TEXT,
    "occupation" TEXT,
    "powerLevel" TEXT,
    "abilities" TEXT,
    "relationships" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remarks" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "modules" JSONB,
    "levels" JSONB,
    "items" JSONB,
    "parameters" JSONB,
    "rules" TEXT,
    "triggers" TEXT,
    "constraints" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remarks" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."world_settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "era" TEXT,
    "description" TEXT,
    "geography" JSONB,
    "politics" JSONB,
    "culture" JSONB,
    "power_system" JSONB,
    "history" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remarks" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."misc_settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "inspirations" JSONB,
    "references" JSONB,
    "notes" JSONB,
    "terminology" JSONB,
    "templates" JSONB,
    "project_tags" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remarks" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "misc_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscripts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."ManuscriptStatus" NOT NULL DEFAULT 'DRAFT',
    "outline_id" INTEGER,
    "project_id" INTEGER,
    "characters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "systems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "worlds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "misc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_words" INTEGER NOT NULL DEFAULT 0,
    "published_words" INTEGER NOT NULL DEFAULT 0,
    "target_words" INTEGER,
    "cover_url" TEXT,
    "last_edited_chapter_id" INTEGER,
    "last_edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscript_volume" (
    "id" SERIAL NOT NULL,
    "manuscript_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" DECIMAL(10,5) NOT NULL,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscript_chapter" (
    "id" SERIAL NOT NULL,
    "manuscript_id" INTEGER,
    "volume_id" INTEGER,
    "title" TEXT NOT NULL,
    "sort_order" DECIMAL(10,5) NOT NULL,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ChapterStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscript_chapter_content" (
    "id" SERIAL NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_chapter_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manuscript_chapter_content_version" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manuscript_chapter_content_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dict_categories_code_key" ON "public"."dict_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "dict_items_category_code_value_key" ON "public"."dict_items"("category_code", "value");

-- CreateIndex
CREATE INDEX "outline_user_id_status_idx" ON "public"."outline"("user_id", "status");

-- CreateIndex
CREATE INDEX "outline_created_at_idx" ON "public"."outline"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "outline_content_outline_id_key" ON "public"."outline_content"("outline_id");

-- CreateIndex
CREATE INDEX "outline_volume_outline_id_sort_order_idx" ON "public"."outline_volume"("outline_id", "sort_order");

-- CreateIndex
CREATE INDEX "outline_chapter_outline_id_sort_order_idx" ON "public"."outline_chapter"("outline_id", "sort_order");

-- CreateIndex
CREATE INDEX "outline_chapter_volume_id_sort_order_idx" ON "public"."outline_chapter"("volume_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "outline_chapter_content_chapter_id_key" ON "public"."outline_chapter_content"("chapter_id");

-- CreateIndex
CREATE INDEX "outline_chapter_content_version_content_id_version_idx" ON "public"."outline_chapter_content_version"("content_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "outline_chapter_content_version_content_id_version_key" ON "public"."outline_chapter_content_version"("content_id", "version");

-- CreateIndex
CREATE INDEX "outline_content_version_content_id_version_idx" ON "public"."outline_content_version"("content_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "outline_content_version_content_id_version_key" ON "public"."outline_content_version"("content_id", "version");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "public"."projects"("user_id");

-- CreateIndex
CREATE INDEX "projects_created_at_idx" ON "public"."projects"("created_at");

-- CreateIndex
CREATE INDEX "character_settings_user_id_idx" ON "public"."character_settings"("user_id");

-- CreateIndex
CREATE INDEX "character_settings_name_idx" ON "public"."character_settings"("name");

-- CreateIndex
CREATE INDEX "system_settings_user_id_idx" ON "public"."system_settings"("user_id");

-- CreateIndex
CREATE INDEX "system_settings_name_idx" ON "public"."system_settings"("name");

-- CreateIndex
CREATE INDEX "world_settings_user_id_idx" ON "public"."world_settings"("user_id");

-- CreateIndex
CREATE INDEX "world_settings_name_idx" ON "public"."world_settings"("name");

-- CreateIndex
CREATE INDEX "misc_settings_user_id_idx" ON "public"."misc_settings"("user_id");

-- CreateIndex
CREATE INDEX "misc_settings_name_idx" ON "public"."misc_settings"("name");

-- CreateIndex
CREATE INDEX "manuscripts_user_id_status_idx" ON "public"."manuscripts"("user_id", "status");

-- CreateIndex
CREATE INDEX "manuscripts_user_id_deleted_at_idx" ON "public"."manuscripts"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "manuscripts_created_at_idx" ON "public"."manuscripts"("created_at");

-- CreateIndex
CREATE INDEX "manuscripts_updated_at_idx" ON "public"."manuscripts"("updated_at");

-- CreateIndex
CREATE INDEX "manuscripts_total_words_idx" ON "public"."manuscripts"("total_words");

-- CreateIndex
CREATE INDEX "manuscripts_last_edited_at_idx" ON "public"."manuscripts"("last_edited_at");

-- CreateIndex
CREATE INDEX "manuscript_volume_manuscript_id_sort_order_idx" ON "public"."manuscript_volume"("manuscript_id", "sort_order");

-- CreateIndex
CREATE INDEX "manuscript_chapter_manuscript_id_sort_order_idx" ON "public"."manuscript_chapter"("manuscript_id", "sort_order");

-- CreateIndex
CREATE INDEX "manuscript_chapter_volume_id_sort_order_idx" ON "public"."manuscript_chapter"("volume_id", "sort_order");

-- CreateIndex
CREATE INDEX "manuscript_chapter_status_idx" ON "public"."manuscript_chapter"("status");

-- CreateIndex
CREATE INDEX "manuscript_chapter_published_at_idx" ON "public"."manuscript_chapter"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "manuscript_chapter_content_chapter_id_key" ON "public"."manuscript_chapter_content"("chapter_id");

-- CreateIndex
CREATE INDEX "manuscript_chapter_content_version_content_id_version_idx" ON "public"."manuscript_chapter_content_version"("content_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "manuscript_chapter_content_version_content_id_version_key" ON "public"."manuscript_chapter_content_version"("content_id", "version");

-- AddCheckConstraint
ALTER TABLE "public"."outline_chapter" ADD CONSTRAINT "outline_chapter_parent_check" CHECK ("outline_id" IS NOT NULL OR "volume_id" IS NOT NULL);

-- AddCheckConstraint
ALTER TABLE "public"."manuscript_chapter" ADD CONSTRAINT "manuscript_chapter_parent_check" CHECK ("manuscript_id" IS NOT NULL OR "volume_id" IS NOT NULL);

-- AddForeignKey
ALTER TABLE "public"."dict_items" ADD CONSTRAINT "dict_items_category_code_fkey" FOREIGN KEY ("category_code") REFERENCES "public"."dict_categories"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline" ADD CONSTRAINT "outline_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline_content" ADD CONSTRAINT "outline_content_outline_id_fkey" FOREIGN KEY ("outline_id") REFERENCES "public"."outline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline_volume" ADD CONSTRAINT "outline_volume_outline_id_fkey" FOREIGN KEY ("outline_id") REFERENCES "public"."outline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline_chapter" ADD CONSTRAINT "outline_chapter_outline_id_fkey" FOREIGN KEY ("outline_id") REFERENCES "public"."outline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline_chapter" ADD CONSTRAINT "outline_chapter_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "public"."outline_volume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline_chapter_content" ADD CONSTRAINT "outline_chapter_content_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."outline_chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline_chapter_content_version" ADD CONSTRAINT "outline_chapter_content_version_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."outline_chapter_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outline_content_version" ADD CONSTRAINT "outline_content_version_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."outline_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."character_settings" ADD CONSTRAINT "character_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."world_settings" ADD CONSTRAINT "world_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."misc_settings" ADD CONSTRAINT "misc_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscripts" ADD CONSTRAINT "manuscripts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_volume" ADD CONSTRAINT "manuscript_volume_manuscript_id_fkey" FOREIGN KEY ("manuscript_id") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_chapter" ADD CONSTRAINT "manuscript_chapter_manuscript_id_fkey" FOREIGN KEY ("manuscript_id") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_chapter" ADD CONSTRAINT "manuscript_chapter_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "public"."manuscript_volume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_chapter_content" ADD CONSTRAINT "manuscript_chapter_content_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."manuscript_chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_chapter_content_version" ADD CONSTRAINT "manuscript_chapter_content_version_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."manuscript_chapter_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
