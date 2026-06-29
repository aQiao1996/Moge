-- CreateEnum
CREATE TYPE "public"."AiTaskType" AS ENUM ('OUTLINE_GENERATE', 'MANUSCRIPT_CONTINUE', 'MANUSCRIPT_POLISH', 'MANUSCRIPT_EXPAND', 'CHAPTER_SUMMARIZE');

-- CreateEnum
CREATE TYPE "public"."AiPromptPresetScope" AS ENUM ('SYSTEM', 'USER', 'PROJECT');

-- CreateEnum
CREATE TYPE "public"."AiCandidateType" AS ENUM ('TEXT');

-- CreateEnum
CREATE TYPE "public"."AiCandidateApplyStatus" AS ENUM ('PENDING', 'APPLIED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "public"."AiCandidateApplyMode" AS ENUM ('INSERT_TAIL', 'REPLACE_SELECTION', 'OVERWRITE_DRAFT', 'SAVE_AS_DRAFT');

-- CreateEnum
CREATE TYPE "public"."AiJobStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELED', 'PARTIAL_SUCCESS');

-- CreateEnum
CREATE TYPE "public"."ProjectMemoryStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."KnowledgeDocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."project_memory_items" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source_type" TEXT NOT NULL DEFAULT 'MANUAL',
    "source_id" INTEGER,
    "status" "public"."ProjectMemoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_memory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chapter_summaries" (
    "id" SERIAL NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "summary" TEXT NOT NULL,
    "summary_type" TEXT NOT NULL DEFAULT 'MANUAL',
    "source_version" INTEGER,
    "generated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_documents" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" "public"."KnowledgeDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_chunks" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_jobs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "outline_id" INTEGER,
    "manuscript_id" INTEGER,
    "chapter_id" INTEGER,
    "task_type" "public"."AiTaskType" NOT NULL,
    "status" "public"."AiJobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT,
    "model" TEXT,
    "preset_id" INTEGER,
    "preset_version" INTEGER,
    "input_payload" JSONB,
    "context_meta" JSONB,
    "result_summary" JSONB,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "heartbeat_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_job_events" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_job_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_prompt_presets" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "task_type" "public"."AiTaskType" NOT NULL,
    "scope" "public"."AiPromptPresetScope" NOT NULL DEFAULT 'SYSTEM',
    "project_id" INTEGER,
    "description" TEXT,
    "is_system_preset" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "latest_version" INTEGER NOT NULL DEFAULT 1,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_prompt_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_prompt_preset_versions" (
    "id" SERIAL NOT NULL,
    "preset_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "user_prompt_template" TEXT NOT NULL,
    "output_format" TEXT,
    "parameter_schema" JSONB,
    "notes" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_prompt_preset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_generation_records" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER,
    "project_id" INTEGER,
    "task_type" "public"."AiTaskType" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "preset_id" INTEGER,
    "preset_version" INTEGER,
    "request_payload" JSONB,
    "context_snapshot" JSONB,
    "output_text" TEXT,
    "token_usage" JSONB,
    "latency_ms" INTEGER,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_generation_candidates" (
    "id" SERIAL NOT NULL,
    "generation_record_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "outline_id" INTEGER,
    "manuscript_id" INTEGER,
    "chapter_id" INTEGER,
    "candidate_type" "public"."AiCandidateType" NOT NULL DEFAULT 'TEXT',
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER,
    "target_content_version" INTEGER,
    "expected_content_hash" TEXT,
    "content" TEXT NOT NULL,
    "diff_meta" JSONB,
    "apply_status" "public"."AiCandidateApplyStatus" NOT NULL DEFAULT 'PENDING',
    "applied_by" INTEGER,
    "applied_at" TIMESTAMP(3),
    "apply_mode" "public"."AiCandidateApplyMode",
    "applied_content_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_memory_items_project_id_status_priority_idx"
  ON "public"."project_memory_items"("project_id", "status", "priority");

-- CreateIndex
CREATE INDEX "project_memory_items_project_id_category_idx"
  ON "public"."project_memory_items"("project_id", "category");

-- CreateIndex
CREATE INDEX "knowledge_documents_project_id_status_updated_at_idx"
  ON "public"."knowledge_documents"("project_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "knowledge_documents_project_id_document_type_idx"
  ON "public"."knowledge_documents"("project_id", "document_type");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunks_document_id_chunk_index_key"
  ON "public"."knowledge_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "knowledge_chunks_project_id_idx"
  ON "public"."knowledge_chunks"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_summaries_chapter_id_key"
  ON "public"."chapter_summaries"("chapter_id");

-- CreateIndex
CREATE INDEX "chapter_summaries_project_id_updated_at_idx"
  ON "public"."chapter_summaries"("project_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompt_presets_code_scope_project_id_key"
  ON "public"."ai_prompt_presets"("code", "scope", "project_id");

-- CreateIndex
CREATE INDEX "ai_prompt_presets_task_type_scope_is_enabled_idx"
  ON "public"."ai_prompt_presets"("task_type", "scope", "is_enabled");

-- CreateIndex
CREATE INDEX "ai_prompt_presets_project_id_task_type_is_enabled_idx"
  ON "public"."ai_prompt_presets"("project_id", "task_type", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompt_preset_versions_preset_id_version_key"
  ON "public"."ai_prompt_preset_versions"("preset_id", "version");

-- CreateIndex
CREATE INDEX "ai_prompt_preset_versions_preset_id_version_idx"
  ON "public"."ai_prompt_preset_versions"("preset_id", "version");

-- CreateIndex
CREATE INDEX "ai_generation_records_project_id_task_type_created_at_idx"
  ON "public"."ai_generation_records"("project_id", "task_type", "created_at");

-- CreateIndex
CREATE INDEX "ai_generation_records_provider_model_idx"
  ON "public"."ai_generation_records"("provider", "model");

-- CreateIndex
CREATE INDEX "ai_generation_records_job_id_idx"
  ON "public"."ai_generation_records"("job_id");

-- CreateIndex
CREATE INDEX "ai_jobs_user_id_status_created_at_idx"
  ON "public"."ai_jobs"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ai_jobs_project_id_status_created_at_idx"
  ON "public"."ai_jobs"("project_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ai_jobs_status_priority_next_retry_at_created_at_idx"
  ON "public"."ai_jobs"("status", "priority", "next_retry_at", "created_at");

-- CreateIndex
CREATE INDEX "ai_jobs_locked_at_idx"
  ON "public"."ai_jobs"("locked_at");

-- CreateIndex
CREATE INDEX "ai_job_events_job_id_created_at_idx"
  ON "public"."ai_job_events"("job_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_generation_candidates_project_id_apply_status_created_at_idx"
  ON "public"."ai_generation_candidates"("project_id", "apply_status", "created_at");

-- CreateIndex
CREATE INDEX "ai_generation_candidates_manuscript_id_chapter_id_apply_status_idx"
  ON "public"."ai_generation_candidates"("manuscript_id", "chapter_id", "apply_status");

-- CreateIndex
CREATE INDEX "ai_generation_candidates_generation_record_id_idx"
  ON "public"."ai_generation_candidates"("generation_record_id");

-- AddForeignKey
ALTER TABLE "public"."project_memory_items"
  ADD CONSTRAINT "project_memory_items_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_documents"
  ADD CONSTRAINT "knowledge_documents_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_chunks"
  ADD CONSTRAINT "knowledge_chunks_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chapter_summaries"
  ADD CONSTRAINT "chapter_summaries_chapter_id_fkey"
  FOREIGN KEY ("chapter_id") REFERENCES "public"."manuscript_chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_prompt_presets"
  ADD CONSTRAINT "ai_prompt_presets_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_prompt_preset_versions"
  ADD CONSTRAINT "ai_prompt_preset_versions_preset_id_fkey"
  FOREIGN KEY ("preset_id") REFERENCES "public"."ai_prompt_presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_ai_configs"
  ADD CONSTRAINT "project_ai_configs_default_continue_preset_id_fkey"
  FOREIGN KEY ("default_continue_preset_id") REFERENCES "public"."ai_prompt_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_ai_configs"
  ADD CONSTRAINT "project_ai_configs_default_polish_preset_id_fkey"
  FOREIGN KEY ("default_polish_preset_id") REFERENCES "public"."ai_prompt_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_ai_configs"
  ADD CONSTRAINT "project_ai_configs_default_expand_preset_id_fkey"
  FOREIGN KEY ("default_expand_preset_id") REFERENCES "public"."ai_prompt_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_ai_configs"
  ADD CONSTRAINT "project_ai_configs_default_outline_preset_id_fkey"
  FOREIGN KEY ("default_outline_preset_id") REFERENCES "public"."ai_prompt_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_jobs"
  ADD CONSTRAINT "ai_jobs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_jobs"
  ADD CONSTRAINT "ai_jobs_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_job_events"
  ADD CONSTRAINT "ai_job_events_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "public"."ai_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_generation_records"
  ADD CONSTRAINT "ai_generation_records_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "public"."ai_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_generation_candidates"
  ADD CONSTRAINT "ai_generation_candidates_generation_record_id_fkey"
  FOREIGN KEY ("generation_record_id") REFERENCES "public"."ai_generation_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed system prompt presets
WITH continue_preset AS (
  INSERT INTO "public"."ai_prompt_presets" (
    "code", "name", "task_type", "scope", "description", "is_system_preset", "is_enabled", "latest_version"
  )
  VALUES (
    'system_manuscript_continue_default',
    '系统默认续写',
    'MANUSCRIPT_CONTINUE',
    'SYSTEM',
    '用于文稿章节续写的系统默认预设',
    true,
    true,
    1
  )
  RETURNING "id"
)
INSERT INTO "public"."ai_prompt_preset_versions" (
  "preset_id", "version", "system_prompt", "user_prompt_template", "output_format", "notes"
)
SELECT
  "id",
  1,
  '你是一位专业的网络小说作家助手。你的任务是根据已有的章节内容和相关设定，续写后续内容。

## 续写要求：
1. 保持与已有内容的文风一致
2. 情节发展要合理自然
3. 充分利用已有的角色、世界观等设定
4. 避免突兀的转折和逻辑矛盾
5. 续写内容应在 500-1000 字左右

## 相关设定：
{{settingsContext}}',
  '## 已有章节内容：
{{currentContent}}

{{#customPrompt}}## 额外要求：
{{customPrompt}}
{{/customPrompt}}
请根据以上内容续写后续情节。',
  'TEXT',
  'Phase A system default'
FROM continue_preset;

WITH polish_preset AS (
  INSERT INTO "public"."ai_prompt_presets" (
    "code", "name", "task_type", "scope", "description", "is_system_preset", "is_enabled", "latest_version"
  )
  VALUES (
    'system_manuscript_polish_default',
    '系统默认润色',
    'MANUSCRIPT_POLISH',
    'SYSTEM',
    '用于文稿文本润色的系统默认预设',
    true,
    true,
    1
  )
  RETURNING "id"
)
INSERT INTO "public"."ai_prompt_preset_versions" (
  "preset_id", "version", "system_prompt", "user_prompt_template", "output_format", "notes"
)
SELECT
  "id",
  1,
  '你是一位专业的文字编辑。你的任务是对提供的文本进行润色，提升文字表达质量。

## 润色要求：
1. 优化语言表达，使其更加流畅优美
2. 修正语法错误和错别字
3. 增强场景描写的画面感
4. 保持原文的核心意思和情节不变
5. 保持原文的文风特点
6. 与已有角色、世界观和设定保持一致

## 相关设定：
{{settingsContext}}',
  '## 待润色文本：
{{sourceText}}

{{#customPrompt}}## 额外要求：
{{customPrompt}}
{{/customPrompt}}
请对以上文本进行润色，直接输出润色后的结果，不要添加任何解释说明。',
  'TEXT',
  'Phase A system default'
FROM polish_preset;

WITH expand_preset AS (
  INSERT INTO "public"."ai_prompt_presets" (
    "code", "name", "task_type", "scope", "description", "is_system_preset", "is_enabled", "latest_version"
  )
  VALUES (
    'system_manuscript_expand_default',
    '系统默认扩写',
    'MANUSCRIPT_EXPAND',
    'SYSTEM',
    '用于文稿文本扩写的系统默认预设',
    true,
    true,
    1
  )
  RETURNING "id"
)
INSERT INTO "public"."ai_prompt_preset_versions" (
  "preset_id", "version", "system_prompt", "user_prompt_template", "output_format", "notes"
)
SELECT
  "id",
  1,
  '你是一位专业的网络小说作家助手。你的任务是对简短的文本进行扩写，丰富细节描写。

## 扩写要求：
1. 扩充场景描写，增强画面感和代入感
2. 丰富人物的心理活动和情绪变化
3. 添加合理的对话和互动
4. 保持情节的核心不变
5. 扩写后的内容应为原文的 2-3 倍长度

## 相关设定：
{{settingsContext}}',
  '## 待扩写文本：
{{sourceText}}

{{#customPrompt}}## 额外要求：
{{customPrompt}}
{{/customPrompt}}
请对以上文本进行扩写，直接输出扩写后的结果，不要添加任何解释说明。',
  'TEXT',
  'Phase A system default'
FROM expand_preset;

WITH outline_preset AS (
  INSERT INTO "public"."ai_prompt_presets" (
    "code", "name", "task_type", "scope", "description", "is_system_preset", "is_enabled", "latest_version"
  )
  VALUES (
    'system-default-outline-generate',
    '系统默认大纲生成',
    'OUTLINE_GENERATE',
    'SYSTEM',
    '用于小说三级大纲生成的系统默认预设',
    true,
    true,
    1
  )
  RETURNING "id"
)
INSERT INTO "public"."ai_prompt_preset_versions" (
  "preset_id", "version", "system_prompt", "user_prompt_template", "output_format", "notes"
)
SELECT
  "id",
  1,
  '你是一位资深小说策划编辑，只输出大纲，绝不写任何正文或章节原文。
所有内容必须控制在“结构层”：情节节点、冲突、悬念、人物目标、情感转折。
禁止出现成段小说正文、对话、场景描写。

【格式刚性要求】
1. 字数控制：总览+人物表≤500字；每卷字数根据总卷数动态分配，公式为(2500-500)/总卷数，确保内容详实且不头重脚轻。达到上限立即用"……"截断。
2. 全程不得出现英文字母、英文标点或英文单词；数字请用中文全角，如"１""２""３"。
3. 卷→章→场景三级逻辑标题，对应Markdown固定用法：
   ### 第１卷（卷）
   #### 第１章（章）
   ##### 场景１（场景）
   不得多一级或少一级。
4. 中文全角数字「１２３」必填；表格单元格内严禁换行，否则Markdown失效；即将超限立即用「……」截断。
5. 卷名、章名、场景名之后若出现半角尖括号&lt;……&gt;及其内部所有文字，一律不输出、不保留、不占字数。
6. 形容调性保持冷峻、克制、信息密度优先；形容词连续出现不得超过1个；禁止成语堆砌及诗意对偶。
7. 禁止出现"AI""算法""数据""系统提示"等元叙事词汇；角色不得感知自己处于小说之外或被生成。
8. 设定使用规范：每卷首章首场景必须显式使用关联设定中的角色、地点或系统，并在「伏笔清单」里登记设定的关键应用节点；人物能力、世界规则、系统机制必须与设定库完全一致，不得自行创造冲突的设定。
9. 人物表「目标」列须用"动作动词+具体名词+量化结果"三要素，禁用改变、追求等抽象动词。',
  '请为我的小说生成一份**分卷-分章-分场景**的三级大纲，使用Markdown。

### 基础信息
- **书名**：{name}
- **类型/题材**：{type}
- **时代**：{era}
- **标签**：{tags}
- **备注**：{remark}

### 关联设定
{settingsContext}

**请严格遵守以下设定使用规则**:
  1. 角色设定: 角色的能力、性格、目标必须与设定库中的定义完全一致
  2. 世界设定: 地理、政治、力量体系必须符合世界观设定
  3. 系统设定: 金手指的运作规则、等级体系必须遵循系统设定
  4. 冲突设计: 优先使用设定中已定义的势力、规则、限制作为冲突来源

### 输出格式

#### 总览
- **主线冲突一句话**：
- **核心悬念一句话**：
- **主角终极目标**：
- **反派终极目标**：

#### 人物表
| 姓名 | 目标（动词+对象） | 阻力（具体人或规则） | 弧光起点→终点（价值反转） |
| :--- | :--- | :--- | :--- |
| 主角 |  |  |  |
| 反派 |  |  |  |
| 关键配角１ |  |  |  |
| 关键配角２ |  |  |  |

#### 分卷大纲
### 第１卷 卷名&lt;一句话卖点，反例：少年为赎罪必须弑神&gt;
#### 第１章 章名
- **场景１**：场景目标+冲突点+悬念钩子
- **场景２**：场景目标+冲突点+悬念钩子
- **场景３**：场景目标+冲突点+悬念钩子
#### 第２章 章名
……

### 第２卷 卷名&lt;一句话卖点&gt;
……

#### 伏笔清单&lt;至少２条，格式：卷Ｘ埋→卷Ｙ收：一句话说明&gt;
- **卷１埋→卷３收**：
- **卷２埋→终卷收**：',
  'MARKDOWN',
  'Phase B system default'
FROM outline_preset;
