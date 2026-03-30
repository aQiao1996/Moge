# 墨阁 V2 详细规划

本文件用于定义“墨阁”下一阶段的产品目标、业务范围、技术方案、数据模型、接口设计、页面规划、实施顺序、风险控制与验收标准。

与此前按 `V1 / V2 / V3` 拆分的方案不同，本文件将此前讨论过的三阶段能力合并进一个统一的 `V2` 范围中，再通过 `V2 内部分阶段` 进行落地。这样既保证版本目标完整，也方便实施时保持节奏。

---

## 1. 文档目的

本文件解决以下问题：

1. 明确墨阁 V2 到底要做什么，不做什么。
2. 统一产品、前端、后端、数据库、测试对 V2 的理解。
3. 将“AI 配置、Prompt 预设、上下文编排、后台任务、结果版本化、轻量知识库与项目记忆”纳入同一个版本目标。
4. 保证 V2 方案与当前墨阁代码架构兼容，不走推倒重来的路线。
5. 提供一份可以直接继续拆表、拆接口、拆页面、拆任务的母文档。

---

## 2. 当前项目基线

### 2.1 当前已经具备的能力

结合现有代码与文档，墨阁当前已经具备以下基础：

- 账号密码登录、注册、个人资料与密码修改。
- GitLab 第三方登录。
- 项目管理。
- 设定集管理。
- 大纲管理。
- 文稿管理。
- 文稿编辑器、自动保存、章节发布。
- 大纲 AI 流式生成。
- 文稿 AI 辅助：续写、润色、扩写。
- 工作台、统计、导出、字典管理。

### 2.2 当前技术架构

- Monorepo：`pnpm workspace`
- 前端：`Next.js + React 18 + TypeScript`
- 后端：`NestJS + Prisma + PostgreSQL`
- 类型共享：`packages/types`
- 鉴权：`NextAuth + Credentials + GitLab`
- AI 调用：当前已支持 `gemini / openai / moonshot / openai_compatible`

### 2.3 当前 AI 能力的边界

当前 AI 能力已经具备“调用模型完成单次生成”的基础，但还存在明显短板：

- AI 配置仍偏全局与开发环境层面，缺少用户可见的项目级配置能力。
- Prompt 缺少可管理、可复用、可版本化的体系。
- AI 调用缺少统一的上下文编排层。
- 长任务仍偏前台等待，缺少稳定的后台任务中心。
- AI 生成结果缺少完整的记录、候选、采纳与回溯机制。
- 设定集、大纲、文稿之间的数据还没有被统一整理为“项目知识上下文”。
- 缺少项目级记忆与轻量检索能力。

这意味着：当前墨阁已经不是“没有 AI”，而是“AI 还是功能级能力，尚未升级为平台级基础设施”。

---

## 3. V2 总体定义

### 3.1 V2 的一句话定义

墨阁 V2 的目标不是做成通用 AI 聊天应用，而是在保留“项目 - 设定 - 大纲 - 文稿”主链路的基础上，把 AI 能力升级为贯穿整个创作流程的基础设施。

### 3.2 V2 的核心定位

V2 将墨阁从：

- 结构化创作管理系统 + 单点 AI 辅助

升级为：

- 结构化创作工作台 + 可配置的 AI 创作中枢

### 3.3 V2 的核心价值

V2 需要同时提供以下价值：

1. AI 能力可配置  
   用户可以为项目设置模型、预设、上下文策略，而不是只能使用系统默认值。

2. AI 结果可追溯  
   用户知道这次生成用了什么模型、什么预设、哪些设定、哪些章节摘要。

3. AI 任务可管理  
   长任务不阻塞创作界面，支持查看、取消、重试、复盘。

4. AI 输出可采纳  
   生成结果先作为候选，而不是直接覆盖正文。

5. AI 具备项目记忆  
   AI 能理解当前项目的角色、世界观、规则、已写内容与风格约束。

---

## 4. V2 范围总览

V2 包含以下 7 个核心能力模块：

| 模块 | 名称              | V2 是否必须 | 说明                                           |
| ---- | ----------------- | ----------- | ---------------------------------------------- |
| A    | AI 配置中心       | 是          | 项目级 AI 配置、模型选择、参数策略             |
| B    | Prompt 预设中心   | 是          | 续写/润色/扩写/大纲生成等预设模板管理          |
| C    | 上下文编排层      | 是          | 统一拼装项目设定、章节摘要、用户输入、检索结果 |
| D    | AI 后台任务中心   | 是          | 长耗时生成、重试、取消、状态追踪               |
| E    | 生成结果版本化    | 是          | 候选结果、采纳、替换、插入、回滚               |
| F    | 项目知识库与记忆  | 是          | 项目资料、章节摘要、项目记忆、轻量检索         |
| G    | AI 数据追踪与分析 | 是          | 调用记录、成功率、耗时、使用来源、采纳率       |

### 4.1 V2 不包含的内容

以下内容明确不作为 V2 的首发要求：

- 通用聊天助手首页
- 管理员后台
- 多租户企业权限体系
- 社区 Prompt 市场
- 全量图谱平台
- 一上来就做复杂 Redis / MQ / 分布式队列体系
- 一上来就做全量向量检索平台
- 对外开放的模型市场

### 4.2 V2 与当前主菜单的关系

V2 不新增一级主菜单。

现有一级菜单仍保持：

- 工作台
- 大纲
- 文稿
- 设定集
- 字典管理
- 统计

V2 的新能力通过以下方式承载：

- 工作台增加 AI 任务与 AI 使用概览
- 项目详情页增加 AI 配置入口
- 大纲页增加后台任务化的 AI 生成入口
- 文稿编辑页升级 AI 面板
- 设定集与文稿体系为项目知识库提供素材
- 统计页增加 AI 使用维度

---

## 5. V2 产品目标

### 5.1 面向用户的目标

V2 需要让作者获得以下感受：

- “我可以为每个项目单独设定 AI 风格和模型。”
- “AI 续写不再像碰运气，而是更懂我这个项目。”
- “长任务不用卡在当前页面，我可以一边写一边等。”
- “AI 结果不会直接毁掉正文，我能先看再决定要不要用。”
- “AI 为什么这样写，我大致能看明白。”

### 5.2 面向团队的目标

V2 需要让团队获得以下收益：

- AI 相关需求不再每次都从零搭建接口。
- Prompt、上下文、任务、结果管理形成统一架构。
- 后续新增新模型、新任务类型、新知识源时不需要重写整套逻辑。
- AI 功能具备可观测性，能定位效果差是模型问题、上下文问题还是预设问题。

---

## 6. V2 成功标准

如果 V2 完成后满足以下标准，则认为版本方向正确：

1. 项目级 AI 配置可用。
2. 至少 4 类 Prompt 预设可管理、可选择、可版本化。
3. 大纲长生成可以任务化执行。
4. 文稿 AI 续写、润色、扩写都可以带项目上下文执行。
5. AI 结果不直接覆盖正文，支持候选与采纳。
6. 项目知识源可被上下文编排层引用。
7. 工作台可以查看 AI 任务和 AI 使用情况。
8. 至少有一套基础统计：调用次数、成功率、平均耗时、采纳率。

---

## 7. V2 用户角色与使用场景

### 7.1 用户角色

V2 主要围绕以下角色设计：

- 普通作者
- 高级作者
- 内容整理型作者

### 7.2 关键场景

#### 场景一：项目级 AI 配置

用户进入某个项目，在项目设置中选择：

- 使用的 Provider
- 使用的模型
- 默认续写预设
- 默认润色预设
- 默认扩写预设
- 是否优先引用角色/世界/系统设定
- 是否自动引用章节摘要

#### 场景二：大纲后台生成

用户在大纲详情页点击“生成大纲”，系统不会一直卡在页面流式输出，而是：

1. 创建一个 AI 任务。
2. 在任务中心显示运行状态。
3. 生成完成后，大纲页可查看候选结果。
4. 用户确认后写入大纲内容。

#### 场景三：文稿 AI 辅助升级

用户在文稿编辑页使用 AI 续写时：

1. 选择预设。
2. 输入附加要求。
3. 系统自动组装项目设定、章节摘要、当前章节、近期上下文。
4. 生成结果以候选文本形式展示。
5. 用户选择“插入末尾 / 替换选区 / 覆盖当前草稿 / 暂存为候选”。

#### 场景四：项目记忆与知识引用

用户为项目添加：

- 风格说明
- 禁忌设定
- 人物关系约束
- 常用称谓
- 叙事口径

之后每次生成时，系统会自动按策略抽取相关记忆项。

#### 场景五：任务复盘

用户进入工作台，查看：

- 最近 AI 任务
- 失败任务
- 可重试任务
- AI 使用趋势
- 哪些结果被采纳、哪些被丢弃

---

## 8. V2 信息架构与页面规划

### 8.1 一级导航

保持不变：

- `/workspace`
- `/outline`
- `/manuscripts`
- `/settings`
- `/dictionary`
- `/stats`

### 8.2 新增或扩展的页面入口

#### 8.2.1 工作台

在 `/workspace` 增加：

- AI 任务概览卡片
- 最近 AI 任务列表
- 失败任务提醒
- AI 使用概览卡片

建议新增二级入口：

- `/workspace/ai-jobs`
- `/workspace/ai-insights`

#### 8.2.2 项目页

在项目详情页增加 “AI 配置” Tab 或独立区块：

- Provider
- Model
- 默认预设
- 上下文引用策略
- 生成结果写入策略
- 任务执行偏好

建议路由：

- `/settings/[projectId]?tab=ai`

#### 8.2.3 大纲页

大纲详情页与编辑页增加：

- 生成任务提交入口
- 任务进度显示
- 候选结果查看
- 结果采纳与覆盖

#### 8.2.4 文稿编辑页

升级现有 AI 面板，新增：

- 预设选择
- 项目配置继承提示
- 上下文来源展示
- 候选结果面板
- 采纳方式选择
- AI 历史记录入口

#### 8.2.5 设定集页

现有设定页不需要重做，但要增加 AI 相关能力：

- 标记“是否高优先级上下文”
- 标记“是否可进入 AI 记忆”
- 标记“是否只在某些任务中引用”

#### 8.2.6 统计页

新增 AI 分析维度：

- 调用次数
- 成功率
- 平均耗时
- 任务分布
- 预设使用频次
- 采纳率

---

## 9. V2 功能模块详细设计

## 9.1 模块 A：AI 配置中心

### 9.1.1 目标

将当前偏环境变量的 AI 配置，升级为用户可见、项目可配置、功能可复用的业务能力。

### 9.1.2 配置层级

V2 采用三级配置继承：

1. 系统默认配置
2. 项目配置
3. 单次任务临时覆盖

优先级从高到低：

- 单次任务临时覆盖
- 项目配置
- 系统默认配置

### 9.1.3 配置项

项目级 AI 配置至少包含：

- `provider`
- `model`
- `temperature`
- `maxTokens`
- `defaultContinuePresetId`
- `defaultPolishPresetId`
- `defaultExpandPresetId`
- `defaultOutlinePresetId`
- `enableCharacterContext`
- `enableSystemContext`
- `enableWorldContext`
- `enableMiscContext`
- `enableChapterSummaryContext`
- `enableProjectMemoryContext`
- `contextLengthStrategy`
- `resultApplyStrategy`
- `asyncTaskThreshold`

### 9.1.4 设计原则

- 普通用户优先使用项目默认配置。
- 高级用户可以在单次任务里临时切换。
- 不把过多专业参数直接暴露给所有用户。
- 先支持平台托管的模型配置。
- 用户自带 API Key 不是 V2 首发要求。

---

## 9.2 模块 B：Prompt 预设中心

### 9.2.1 目标

把当前零散的 Prompt 逻辑沉淀成可维护资产。

### 9.2.2 预设分类

V2 至少需要以下预设分类：

- 大纲生成
- 章节续写
- 文本润色
- 文本扩写
- 章节总结
- 风格改写
- 人设一致性检查
- 世界观冲突检查

### 9.2.3 预设结构

每个预设包含：

- 名称
- 代码标识
- 适用任务类型
- 描述
- System Prompt
- User Prompt 模板
- 输出格式要求
- 可选参数 schema
- 是否启用
- 是否系统预设
- 版本号

### 9.2.4 预设能力

V2 中的 Prompt 预设需要支持：

- 创建
- 编辑
- 禁用
- 克隆
- 版本化
- 设为项目默认值
- 使用统计

### 9.2.5 预设模板变量

模板变量建议统一从上下文编排层提供，例如：

- `{{project_name}}`
- `{{project_description}}`
- `{{characters_context}}`
- `{{systems_context}}`
- `{{worlds_context}}`
- `{{misc_context}}`
- `{{chapter_summary_context}}`
- `{{current_chapter_title}}`
- `{{current_chapter_content}}`
- `{{selected_text}}`
- `{{user_instruction}}`

---

## 9.3 模块 C：上下文编排层

### 9.3.1 目标

将“当前任务到底给模型什么上下文”变成统一机制，而不是每个接口各自拼接字符串。

### 9.3.2 上下文来源

V2 的上下文来源包括：

- 项目基础信息
- 项目关联角色设定
- 项目关联系统设定
- 项目关联世界设定
- 项目关联辅助设定
- 当前大纲内容
- 当前文稿与当前章节
- 章节摘要
- 项目记忆
- 任务类型对应的 Prompt 预设
- 用户本次输入的附加要求
- 可选的检索命中结果

### 9.3.3 编排顺序

建议采用统一顺序：

1. 系统安全规则
2. 任务类型规则
3. Prompt 预设 System Prompt
4. 项目 AI 配置派生规则
5. 项目基础信息
6. 结构化设定上下文
7. 项目记忆
8. 章节摘要或检索结果
9. 当前内容
10. 用户临时指令

### 9.3.4 结构化上下文优先级

V2 要求优先使用结构化信息，而不是直接把整章整卷粗暴塞给模型：

- 角色设定优先于角色相关长文档
- 章节摘要优先于历史全文
- 项目记忆优先于随意检索结果
- 当前选中文本优先于全文润色

### 9.3.5 上下文裁剪策略

V2 需要支持基本的 token 预算策略：

- `short`
- `balanced`
- `rich`

其中：

- `short` 仅放核心设定 + 当前内容
- `balanced` 增加章节摘要与项目记忆
- `rich` 增加更多检索结果与辅助资料

### 9.3.6 可解释性要求

每次生成都应记录上下文来源清单，例如：

- 使用了哪些设定
- 使用了哪些摘要
- 使用了哪些记忆项
- 是否引用当前章节全文

这不是给模型看的，而是给用户与团队追溯用的。

---

## 9.4 模块 D：AI 后台任务中心

### 9.4.1 目标

让长耗时 AI 操作脱离“前台强依赖页面停留”的模式。

### 9.4.2 任务类型

V2 支持的任务类型建议包括：

- 大纲生成
- 大纲重生成
- 章节续写
- 章节总结
- 章节批量总结
- 风格改写
- 一致性检查
- 项目知识整理
- 项目记忆提取

### 9.4.3 任务状态

统一状态机：

- `PENDING`
- `QUEUED`
- `RUNNING`
- `SUCCESS`
- `FAILED`
- `CANCELED`
- `PARTIAL_SUCCESS`

### 9.4.4 任务能力

V2 任务系统需要具备：

- 创建任务
- 查看任务详情
- 查看进度
- 取消任务
- 重试任务
- 查看失败原因
- 查看产出结果
- 跳转到结果使用位置

### 9.4.5 技术策略

V2 首版不强制引入 Redis。

建议先采用：

- PostgreSQL 持久化任务表
- NestJS Worker 轮询执行
- 单机串行或限并发执行

后续如果并发与稳定性压力明显，再升级为：

- Redis + BullMQ

### 9.4.6 任务与页面关系

- 大纲生成优先走任务模式
- 长篇续写可根据长度阈值切到任务模式
- 短润色、短扩写保留同步执行

### 9.4.7 任务中心展示字段

每条任务至少显示：

- 任务名称
- 任务类型
- 所属项目
- 触发来源
- 状态
- 开始时间
- 结束时间
- 耗时
- 结果条数
- 是否已采纳

---

## 9.5 模块 E：生成结果版本化

### 9.5.1 目标

AI 输出先成为候选结果，而不是直接污染正文。

### 9.5.2 候选结果形态

V2 中 AI 生成结果建议支持以下形态：

- 文本候选
- 大纲候选
- 章节候选
- 摘要候选
- 结构化记忆候选

### 9.5.3 用户操作

对于 AI 结果，用户需要支持：

- 预览
- 比较
- 采纳
- 替换
- 插入
- 保存为草稿
- 丢弃

### 9.5.4 与编辑器的关系

文稿编辑页内的 AI 结果不应默认立刻写入正文。

应当采用以下交互：

1. 生成结果出现在右侧候选面板。
2. 用户选择处理方式。
3. 执行“插入末尾 / 替换选区 / 覆盖当前草稿 / 暂存候选”。

### 9.5.5 可回溯性

采纳行为必须落记录：

- 谁采纳了
- 采纳了哪条结果
- 以什么方式采纳
- 对应的源任务是什么

---

## 9.6 模块 F：项目知识库与记忆

### 9.6.1 目标

把现有“项目、设定、大纲、文稿”这些结构化资源真正转成 AI 可消费的知识层。

### 9.6.2 知识源分类

V2 需要支持以下知识源：

- 角色设定
- 系统设定
- 世界设定
- 辅助设定
- 大纲摘要
- 章节摘要
- 项目资料文档
- 用户手工维护的项目记忆

### 9.6.3 项目记忆分类

建议项目记忆至少分成：

- 风格偏好
- 人物关系
- 世界规则
- 叙事禁忌
- 常用称谓
- 长期伏笔
- 重要剧情事实

### 9.6.4 V2 的知识策略

V2 采用“轻量知识库”策略：

- 优先使用现有结构化数据
- 用摘要代替全文
- 用项目范围检索代替全站通用检索
- 不要求首发就上复杂向量平台

### 9.6.5 V2 的检索逻辑

建议采用分层检索：

1. 结构化命中
2. 项目记忆命中
3. 章节摘要命中
4. 项目资料文档命中

### 9.6.6 未来扩展位

V2 需要预留扩展位，但不强制首发实现：

- `pgvector`
- embedding 持久化
- rerank
- 更复杂的图谱关系

---

## 9.7 模块 G：AI 数据追踪与分析

### 9.7.1 目标

让团队知道 AI 功能是否真的有效。

### 9.7.2 需要统计的指标

- 调用次数
- 成功率
- 失败率
- 平均耗时
- 平均输出长度
- 任务来源分布
- 预设使用频率
- 候选结果采纳率
- 按项目维度的 AI 使用情况

### 9.7.3 对产品的意义

这些指标将直接帮助判断：

- 哪类 AI 功能最常用
- 哪类 Prompt 效果差
- 哪类任务最慢
- 上下文编排是否过重
- 哪些功能值得继续加大投入

---

## 10. V2 数据模型设计

以下为建议的数据结构草案，用于后续 Prisma 设计。

## 10.1 `project_ai_configs`

用于项目级 AI 配置。

建议字段：

- `id`
- `projectId`
- `provider`
- `model`
- `temperature`
- `maxTokens`
- `defaultContinuePresetId`
- `defaultPolishPresetId`
- `defaultExpandPresetId`
- `defaultOutlinePresetId`
- `enableCharacterContext`
- `enableSystemContext`
- `enableWorldContext`
- `enableMiscContext`
- `enableChapterSummaryContext`
- `enableProjectMemoryContext`
- `contextLengthStrategy`
- `resultApplyStrategy`
- `asyncTaskThreshold`
- `createdAt`
- `updatedAt`

## 10.2 `ai_prompt_presets`

用于存放 Prompt 预设的主记录。

建议字段：

- `id`
- `code`
- `name`
- `taskType`
- `description`
- `isSystemPreset`
- `isEnabled`
- `latestVersion`
- `createdBy`
- `createdAt`
- `updatedAt`

## 10.3 `ai_prompt_preset_versions`

用于存放每次预设版本内容。

建议字段：

- `id`
- `presetId`
- `version`
- `systemPrompt`
- `userPromptTemplate`
- `outputFormat`
- `parameterSchema`
- `notes`
- `createdBy`
- `createdAt`

## 10.4 `ai_jobs`

用于 AI 后台任务。

建议字段：

- `id`
- `userId`
- `projectId`
- `outlineId`
- `manuscriptId`
- `chapterId`
- `taskType`
- `status`
- `priority`
- `provider`
- `model`
- `presetId`
- `presetVersion`
- `inputPayload`
- `contextMeta`
- `resultSummary`
- `errorMessage`
- `retryCount`
- `startedAt`
- `finishedAt`
- `createdAt`
- `updatedAt`

## 10.5 `ai_job_events`

用于任务进度与执行日志。

建议字段：

- `id`
- `jobId`
- `eventType`
- `message`
- `payload`
- `createdAt`

## 10.6 `ai_generation_records`

用于每次实际模型调用的详细记录。

建议字段：

- `id`
- `jobId`
- `projectId`
- `taskType`
- `provider`
- `model`
- `presetId`
- `presetVersion`
- `requestPayload`
- `contextSnapshot`
- `outputText`
- `tokenUsage`
- `latencyMs`
- `status`
- `errorMessage`
- `createdAt`

## 10.7 `ai_generation_candidates`

用于存储候选结果。

建议字段：

- `id`
- `generationRecordId`
- `projectId`
- `outlineId`
- `manuscriptId`
- `chapterId`
- `candidateType`
- `content`
- `diffMeta`
- `applyStatus`
- `appliedBy`
- `appliedAt`
- `applyMode`
- `createdAt`

## 10.8 `chapter_summaries`

用于章节摘要。

建议字段：

- `id`
- `chapterId`
- `projectId`
- `summary`
- `summaryType`
- `sourceVersion`
- `generatedBy`
- `createdAt`
- `updatedAt`

## 10.9 `project_memory_items`

用于项目记忆。

建议字段：

- `id`
- `projectId`
- `category`
- `title`
- `content`
- `priority`
- `sourceType`
- `sourceId`
- `status`
- `createdBy`
- `createdAt`
- `updatedAt`

## 10.10 `knowledge_documents`

用于项目资料文档。

建议字段：

- `id`
- `projectId`
- `title`
- `documentType`
- `content`
- `source`
- `status`
- `createdBy`
- `createdAt`
- `updatedAt`

## 10.11 `knowledge_chunks`

用于轻量切片检索。

建议字段：

- `id`
- `documentId`
- `projectId`
- `chunkIndex`
- `content`
- `keywords`
- `summary`
- `createdAt`

## 10.12 可选扩展表

如果后续需要向量检索，可追加：

- `knowledge_embeddings`
- `memory_embeddings`

但不作为 V2 首发强制项。

---

## 11. 后端架构设计

### 11.1 新增模块建议

V2 建议新增以下 Nest 模块：

- `AiConfigModule`
- `AiPromptModule`
- `AiContextModule`
- `AiJobModule`
- `AiKnowledgeModule`
- `AiAnalyticsModule`

### 11.2 模块职责

#### `AiConfigModule`

负责：

- 读取项目 AI 配置
- 更新项目 AI 配置
- 处理系统默认配置继承

#### `AiPromptModule`

负责：

- Prompt 预设的 CRUD
- 预设版本化
- 任务类型与预设匹配

#### `AiContextModule`

负责：

- 汇总上下文来源
- 上下文裁剪
- 构造可追溯的上下文快照

#### `AiJobModule`

负责：

- 创建任务
- 拉取待执行任务
- 执行状态变更
- 重试与取消

#### `AiKnowledgeModule`

负责：

- 管理项目资料文档
- 管理章节摘要
- 管理项目记忆
- 提供轻量检索

#### `AiAnalyticsModule`

负责：

- 聚合 AI 使用指标
- 输出统计接口

---

## 12. 接口设计草案

以下为建议接口，不要求一次性全部完成，但应作为统一方向。

## 12.1 AI 配置

- `GET /projects/:id/ai-config`
- `PUT /projects/:id/ai-config`
- `GET /ai-config/defaults`

## 12.2 Prompt 预设

- `GET /ai/presets`
- `POST /ai/presets`
- `GET /ai/presets/:id`
- `PUT /ai/presets/:id`
- `POST /ai/presets/:id/versions`
- `GET /ai/presets/:id/versions`
- `POST /ai/presets/:id/clone`

## 12.3 AI 任务

- `POST /ai/jobs`
- `GET /ai/jobs`
- `GET /ai/jobs/:id`
- `POST /ai/jobs/:id/cancel`
- `POST /ai/jobs/:id/retry`
- `GET /ai/jobs/:id/events`

## 12.4 结果候选

- `GET /ai/candidates`
- `GET /ai/candidates/:id`
- `POST /ai/candidates/:id/apply`
- `POST /ai/candidates/:id/discard`

## 12.5 项目知识与记忆

- `GET /projects/:id/memory`
- `POST /projects/:id/memory`
- `PUT /projects/:id/memory/:memoryId`
- `DELETE /projects/:id/memory/:memoryId`
- `GET /projects/:id/knowledge-documents`
- `POST /projects/:id/knowledge-documents`
- `PUT /projects/:id/knowledge-documents/:documentId`
- `DELETE /projects/:id/knowledge-documents/:documentId`

## 12.6 摘要相关

- `GET /chapters/:id/summary`
- `POST /chapters/:id/summary`
- `POST /projects/:id/summaries/rebuild`

## 12.7 AI 统计

- `GET /stats/ai/overview`
- `GET /stats/ai/projects/:projectId`
- `GET /stats/ai/presets/:presetId`

---

## 13. 前端设计草案

## 13.1 工作台

工作台新增以下区块：

- AI 任务概览
- 最近任务
- 失败任务提醒
- AI 使用分析卡片

### 13.1.1 工作台卡片建议

- 今日 AI 任务数
- 本周 AI 调用数
- 成功率
- 候选采纳率
- 最近失败任务

## 13.2 项目页 AI 配置面板

建议展示区域：

- 模型与 Provider
- 默认任务预设
- 上下文策略
- 结果写入策略
- 长任务阈值

## 13.3 大纲页

新增：

- “提交后台生成”按钮
- 任务状态展示
- 候选结果面板
- 采纳到大纲按钮

## 13.4 文稿编辑页

升级现有 AI 面板为：

- 任务类型选择
- 预设选择
- 附加要求输入
- 上下文来源展示
- 运行方式：同步 / 后台
- 结果面板
- 采纳方式按钮
- 历史记录查看

## 13.5 项目知识页

建议在项目详情中增加 AI 子页签：

- `AI 配置`
- `项目记忆`
- `项目资料`
- `AI 历史`

---

## 14. 任务执行流程设计

## 14.1 大纲生成流程

1. 用户点击生成。
2. 前端读取项目 AI 配置。
3. 创建 AI 任务。
4. 后端进入 `QUEUED`。
5. Worker 拉取任务执行。
6. 上下文编排层组装上下文。
7. 调用模型生成。
8. 生成结果写入候选记录。
9. 任务状态变为 `SUCCESS`。
10. 用户查看候选结果并选择采纳。

## 14.2 文稿续写流程

1. 用户在编辑页选中任务类型与预设。
2. 前端提交任务参数。
3. 后端组装：
   - 项目配置
   - 角色 / 世界 / 系统 / 辅助设定
   - 当前章节
   - 近期摘要
   - 项目记忆
4. 同步任务直接返回候选结果。
5. 异步任务则进入任务中心。
6. 用户选择插入或替换。

## 14.3 章节摘要生成流程

1. 章节保存或发布后，触发摘要更新任务。
2. 系统根据最新章节内容生成摘要。
3. 摘要写入 `chapter_summaries`。
4. 后续 AI 任务优先引用摘要。

## 14.4 项目记忆提取流程

1. 用户选择“从章节提取记忆”。
2. 系统生成候选记忆项。
3. 用户确认后写入项目记忆表。

---

## 15. V2 内部分阶段

虽然所有能力都归属 V2，但实施必须拆解。

## 15.1 V2 Phase A：基础设施层

目标：

- 打通 AI 配置
- 打通 Prompt 预设
- 打通上下文编排层

交付物：

- `project_ai_configs`
- `ai_prompt_presets`
- `ai_prompt_preset_versions`
- 基础配置页面
- 基础预设管理能力
- 统一上下文服务

## 15.2 V2 Phase B：任务化与候选结果

目标：

- 将长任务统一纳入任务中心
- 将 AI 输出统一纳入候选体系

交付物：

- `ai_jobs`
- `ai_job_events`
- `ai_generation_records`
- `ai_generation_candidates`
- 工作台任务卡片
- 大纲任务化生成
- 文稿候选结果面板

## 15.3 V2 Phase C：知识与记忆

目标：

- 让 AI 真正理解项目

交付物：

- `chapter_summaries`
- `project_memory_items`
- `knowledge_documents`
- `knowledge_chunks`
- 项目记忆面板
- 资料管理面板
- 上下文命中展示

## 15.4 V2 Phase D：分析与优化

目标：

- 做出可度量、可优化的闭环

交付物：

- AI 使用概览
- 预设效果统计
- 成功率 / 采纳率分析
- 慢任务与失败任务诊断

---

## 16. 风险与控制

## 16.1 风险：范围过大

V2 合并了此前三阶段能力，最直接的风险就是版本膨胀。

应对：

- 所有能力归属 V2，但实施分 `Phase A-D`
- 每个阶段都必须可独立上线
- 不允许为了“等最终形态”而阻塞前序交付

## 16.2 风险：上下文过重导致生成慢

应对：

- 引入 `short / balanced / rich` 策略
- 摘要优先
- 结构化信息优先
- 记录 token 预算与耗时

## 16.3 风险：AI 结果污染正文

应对：

- 候选结果先行
- 采纳动作显式化
- 保留生成记录与结果追溯

## 16.4 风险：实现复杂度陡增

应对：

- V2 首版使用 PostgreSQL 任务表
- V2 首版不强制 Redis
- V2 首版不强制向量库
- 先用摘要与结构化设定解决 80% 问题

## 16.5 风险：用户不会配置

应对：

- 提供系统默认预设
- 项目默认值可直接使用
- 高级参数折叠展示

---

## 17. 测试与验收

## 17.1 功能验收

至少覆盖：

- 项目 AI 配置保存与继承
- Prompt 预设创建、编辑、版本化
- 上下文组装正确性
- 大纲后台任务创建与执行
- 文稿 AI 结果候选化
- 结果采纳与写回
- 项目记忆 CRUD
- 章节摘要生成与更新
- 工作台任务列表展示
- 统计页 AI 指标展示

## 17.2 技术验收

至少覆盖：

- 接口鉴权正确
- 数据关联正确
- 并发任务状态流转正确
- 错误信息可追溯
- 候选结果不会直接覆盖正文
- 失败任务可重试

## 17.3 体验验收

至少覆盖：

- 用户能理解当前任务是否在后台运行
- 用户能看懂结果来自哪里
- 用户能明确区分“正文”和“AI 候选”
- 页面不因长任务长时间卡死

---

## 18. 版本验收清单

当以下事项完成，可认为 V2 达到上线条件：

- 项目级 AI 配置上线
- 至少 4 类 Prompt 预设上线
- 大纲生成任务化上线
- 文稿 AI 候选结果面板上线
- 项目记忆与章节摘要上线
- 工作台 AI 任务概览上线
- AI 使用基础统计上线

---

## 19. 推荐实施顺序

推荐顺序如下：

1. 先做数据表与基础模块骨架
2. 再做项目 AI 配置与 Prompt 预设
3. 再做统一上下文编排层
4. 再做 AI 任务中心
5. 再做候选结果面板
6. 再做章节摘要与项目记忆
7. 最后做统计与分析

原因：

- 先有配置与上下文，AI 结果才会更稳
- 先有任务中心，长任务才不会拖垮体验
- 先有候选结果，AI 才不会直接破坏正文
- 先有摘要与记忆，AI 才会越来越懂项目

---

## 20. 对团队的直接行动建议

如果以本文件作为 V2 总纲，建议下一步直接拆成以下子文档或任务：

1. `V2 数据库表设计`
2. `V2 后端模块与接口设计`
3. `V2 前端页面与交互设计`
4. `V2 AI 任务状态机设计`
5. `V2 上下文编排规则设计`
6. `V2 测试方案`

---

## 21. 最终结论

V2 不应该被理解成“再多加几个 AI 按钮”。

V2 的本质，是把墨阁现有的：

- 项目
- 设定
- 大纲
- 文稿

与新的：

- AI 配置
- Prompt 预设
- 上下文编排
- 后台任务
- 结果候选
- 项目记忆
- 轻量知识库

连接成一套统一的创作基础设施。

只要这套基础设施搭起来，后续无论是扩模型、扩任务、扩知识库，还是继续做更强的长篇创作能力，都会顺畅得多。
