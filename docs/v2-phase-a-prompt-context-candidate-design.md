# 墨阁 V2.0 Phase A 设计

本文档聚焦 V2 的第一阶段，仅覆盖以下三块能力：

- Prompt 预设
- 上下文编排
- 候选结果与采纳

不包含以下内容：

- AI 任务中心
- 后台 Worker
- 项目知识文档切片
- AI 统计看板

目标是先把“文稿 AI 从直接写正文，升级为可配置、可追溯、可采纳的候选输出链路”落地。

---

## 1. Phase A 目标

Phase A 需要完成以下闭环：

1. 项目 AI 配置可以关联默认 Prompt 预设。
2. 文稿续写、润色、扩写不再在业务服务内各自拼 Prompt。
3. 后端通过统一上下文编排服务生成模型输入。
4. AI 输出先写入候选结果，而不是直接写入正文。
5. 用户显式采纳候选后，正文才发生变更。
6. 采纳动作可以追溯到生成记录、预设版本、上下文快照和正文版本。

Phase A 的核心成果不是“多几个按钮”，而是建立后续任务中心和知识库都能复用的最小 AI 执行骨架。

---

## 2. 范围定义

### 2.1 纳入范围

- 文稿 AI 续写
- 文稿 AI 润色
- 文稿 AI 扩写
- Prompt 预设主表与版本表
- 项目 AI 配置与默认预设的联动
- 统一上下文编排服务
- 生成记录
- 候选结果表
- 候选采纳接口
- 文稿编辑页候选面板

### 2.2 不纳入范围

- 大纲任务化生成
- 后台取消、重试、进度事件
- 自动章节摘要生成
- 项目记忆自动抽取
- 知识文档导入与切片检索
- AI 统计聚合接口

---

## 3. 当前基线与问题

当前文稿 AI 已能读取项目级 AI 配置，并在 `manuscripts.service.ts` 中分别实现续写、润色、扩写逻辑。但当前实现存在以下问题：

- Prompt 逻辑分散在业务方法内，后续新增任务类型会重复拷贝。
- 上下文构造主要是字符串拼接，缺少结构化来源记录。
- AI 输出会很快进入编辑器链路，候选和正文边界不清。
- 缺少生成记录与预设版本追溯能力。
- 权限仍偏向历史 owner 模型，没有明确项目协作角色下的 AI 行为边界。

这意味着当前代码可以作为 Phase A 的迁移起点，但不能直接扩展为 V2 的目标形态。

---

## 4. 设计原则

### 4.1 先统一执行骨架，再扩任务类型

Phase A 只先改造文稿 AI 三类能力。只要预设、上下文、候选链路能在文稿侧跑通，后续大纲、摘要、记忆都可以复用同一套骨架。

### 4.2 先候选后采纳

任何 AI 结果都不直接修改正文。同步调用也一样，先落候选，再由用户采纳。

### 4.3 保持与当前项目 AI 配置兼容

项目 AI 配置表已经存在，Phase A 不重做配置中心，只补齐默认预设联动和“当前生效配置”的使用规则。

### 4.4 结构化优先

上下文服务优先返回结构化片段和来源元数据，再由 Prompt 渲染层转换为模型输入文本。

### 4.5 先解决文稿主链路

知识库、任务中心、分析模块都放后面。Phase A 的重点是把现有最常用的文稿 AI 改造成可控链路。

---

## 5. 数据模型设计

## 5.1 `ai_prompt_presets`

用途：

- 存放预设的主记录
- 承载作用域、启用状态、最新版本等元信息

建议字段：

- `id`
- `code`
- `name`
- `taskType`
- `scope`
- `projectId`
- `description`
- `isSystemPreset`
- `isEnabled`
- `latestVersion`
- `createdBy`
- `createdAt`
- `updatedAt`

约束建议：

- `scope` 枚举：`SYSTEM | USER | PROJECT`
- `taskType` 枚举：Phase A 仅需 `MANUSCRIPT_CONTINUE | MANUSCRIPT_POLISH | MANUSCRIPT_EXPAND`
- `code + scope + projectId` 唯一
- `scope = PROJECT` 时 `projectId` 必填
- `scope = SYSTEM` 时 `createdBy`、`projectId` 可为空

### 5.2 `ai_prompt_preset_versions`

用途：

- 存放预设每个版本的实际内容
- 调用记录引用具体版本，确保生成可追溯

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

约束建议：

- `presetId + version` 唯一
- 主表 `latestVersion` 指向当前最新版本号
- 版本只追加，不覆盖历史记录

### 5.3 `ai_generation_records`

用途：

- 记录一次实际模型调用
- 作为候选结果的上游来源

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

Phase A 规则：

- `jobId` 允许为空，因为首期仍以同步调用为主
- 无论同步还是异步，将来都统一落该表
- `contextSnapshot` 保存脱敏后的上下文快照与来源清单，不保存不必要的内部实现细节

### 5.4 `ai_generation_candidates`

用途：

- 存储用户可采纳的 AI 输出

建议字段：

- `id`
- `generationRecordId`
- `projectId`
- `outlineId`
- `manuscriptId`
- `chapterId`
- `candidateType`
- `targetType`
- `targetId`
- `targetContentVersion`
- `expectedContentHash`
- `content`
- `diffMeta`
- `applyStatus`
- `appliedBy`
- `appliedAt`
- `applyMode`
- `appliedContentVersion`
- `createdAt`

Phase A 规则：

- `candidateType` 先支持 `TEXT`
- `targetType` 先支持 `MANUSCRIPT_CHAPTER_CONTENT`
- `applyStatus` 先支持 `PENDING | APPLIED | DISCARDED`
- `applyMode` 先支持 `INSERT_TAIL | REPLACE_SELECTION | OVERWRITE_DRAFT | SAVE_AS_DRAFT`

---

## 6. 领域枚举与命名

为避免 Phase A 上线后再次批量改名，文档、接口、数据库统一以下命名：

- 上下文长度策略：`COMPACT | BALANCED | EXPANDED`
- 文稿 AI 任务类型：`MANUSCRIPT_CONTINUE | MANUSCRIPT_POLISH | MANUSCRIPT_EXPAND`
- Prompt 作用域：`SYSTEM | USER | PROJECT`
- 候选状态：`PENDING | APPLIED | DISCARDED`

前端文案可以显示为“精简 / 均衡 / 丰富”，但传输层不再使用 `short / balanced / rich`。

---

## 7. 后端架构设计

## 7.1 新增模块建议

Phase A 建议新增：

- `AiPromptModule`
- `AiContextModule`
- `AiGenerationModule`

不建议在 Phase A 直接引入：

- `AiJobModule`
- `AiAnalyticsModule`

## 7.2 模块职责

### `AiPromptModule`

负责：

- 预设 CRUD
- 预设版本化
- 根据 `taskType` 与项目配置解析默认预设

### `AiContextModule`

负责：

- 根据任务类型和项目配置汇总上下文来源
- 生成结构化上下文片段
- 生成上下文来源清单
- 产出渲染 Prompt 所需的变量对象

### `AiGenerationModule`

负责：

- 调用 `AiPromptModule` 解析预设
- 调用 `AiContextModule` 组装上下文
- 调用模型
- 写入 `ai_generation_records`
- 写入 `ai_generation_candidates`
- 处理候选采纳

文稿服务不再直接负责拼 Prompt 和直接返回裸文本，而是调用 `AiGenerationModule` 完成执行。

---

## 8. Prompt 预设设计

## 8.1 Phase A 需要的系统预设

至少内置四个系统预设：

- 文稿续写默认预设
- 文稿润色默认预设
- 文稿扩写默认预设
- 通用风格保守预设

其中前三个用于项目默认值联动，第四个用于后续克隆和对照测试。

## 8.2 预设解析规则

一次文稿 AI 调用的预设解析顺序：

1. 单次调用显式传入的 `presetId`
2. 项目 AI 配置中对应任务类型的默认预设
3. 系统默认预设

解析结果需要输出：

- `presetId`
- `presetVersion`
- `taskType`
- `systemPrompt`
- `userPromptTemplate`
- `parameterSchema`

## 8.3 预设模板变量

Phase A 至少提供以下变量：

- `project_name`
- `project_description`
- `characters_context`
- `systems_context`
- `worlds_context`
- `misc_context`
- `current_chapter_title`
- `current_chapter_content`
- `selected_text`
- `user_instruction`

Phase A 不强制引入章节摘要和项目记忆变量，但上下文服务接口需要预留扩展位。

---

## 9. 上下文编排设计

## 9.1 输入

上下文服务输入建议包含：

- `taskType`
- `projectId`
- `chapterId`
- `selectedText`
- `userInstruction`
- `contextLengthStrategy`
- `contextToggles`

其中 `contextToggles` 直接来自项目 AI 配置与单次覆盖合并后的结果。

## 9.2 输出

上下文服务输出建议包含两层结果：

### 面向 Prompt 渲染

- `variables`

### 面向追溯

- `contextSnapshot`
- `sourceItems`

`sourceItems` 建议按数组返回，每项至少包括：

- `sourceType`
- `sourceId`
- `sourceName`
- `included`
- `reason`
- `contentPreview`

## 9.3 Phase A 的来源范围

Phase A 只接入以下来源：

- 项目基础信息
- 项目关联角色设定
- 项目关联系统设定
- 项目关联世界设定
- 项目关联辅助设定
- 当前章节标题
- 当前章节内容
- 当前选中文本
- 用户附加要求

Phase A 暂不接入：

- 章节摘要
- 项目记忆
- 检索命中
- 外部知识文档

原因：

- 这些能力尚未稳定落表
- 先用结构化设定和当前章节就可以解决文稿 AI 第一阶段的大部分问题

## 9.4 裁剪策略

`COMPACT`

- 放项目基础信息
- 放高优先级设定摘要
- 放当前章节末尾片段或选中文本

`BALANCED`

- 在 `COMPACT` 基础上增加更多设定摘要
- 当前章节允许更长截断窗口

`EXPANDED`

- 在 `BALANCED` 基础上放入更多辅助设定字段
- 为后续章节摘要、记忆和检索预留插槽

## 9.5 Prompt 渲染方式

建议统一采用：

1. 预设版本提供 `systemPrompt`
2. 预设版本提供 `userPromptTemplate`
3. 上下文服务返回变量对象
4. 渲染层将模板变量替换为具体内容

这样可以把“拿什么上下文”和“怎么表达给模型”彻底分开。

---

## 10. 文稿 AI 执行链路

## 10.1 调用流程

以文稿续写为例：

1. 前端提交 `chapterId`、任务类型、可选 `presetId`、可选 `userInstruction`
2. 后端读取章节、文稿、项目配置与权限
3. 解析本次生效配置
4. 解析本次使用的预设及版本
5. 调用上下文服务生成变量与来源清单
6. 渲染 Prompt
7. 调用模型
8. 写入 `ai_generation_records`
9. 写入 `ai_generation_candidates`
10. 返回候选结果给前端

## 10.2 同步返回模型

Phase A 同步接口统一返回候选对象，而不是裸字符串。

建议响应结构至少包含：

- `generationRecord`
- `candidate`
- `effectiveConfig`
- `contextSources`

这样前端从第一天开始就按“候选面板”建模，不会再依赖“生成结果就是正文”的旧心智。

---

## 11. 候选结果与采纳设计

## 11.1 候选展示

文稿编辑页右侧 AI 面板调整为两段：

- 上半部分：任务参数区
- 下半部分：候选结果区

候选结果区至少展示：

- 结果文本
- 使用的预设名称
- 使用的模型
- 使用的上下文来源摘要
- 创建时间
- 采纳按钮组

## 11.2 采纳模式

Phase A 先支持四种采纳动作：

- `INSERT_TAIL`
- `REPLACE_SELECTION`
- `OVERWRITE_DRAFT`
- `SAVE_AS_DRAFT`

`SAVE_AS_DRAFT` 的具体语义建议定义为：

- 生成内容先写回章节草稿内容
- 但仍保留候选记录已采纳状态和来源链路

## 11.3 版本一致性校验

采纳接口必须接收：

- `candidateId`
- `expectedContentVersion` 或 `expectedContentHash`
- `applyMode`

后端在事务内：

1. 读取候选
2. 读取当前章节内容与版本
3. 校验版本是否仍匹配
4. 匹配则写入正文并增加版本历史
5. 更新候选状态与采纳信息

若不匹配：

- 返回冲突错误
- 不自动覆盖正文

## 11.4 候选生命周期

Phase A 只定义最小生命周期：

- 新建后为 `PENDING`
- 用户采纳后变为 `APPLIED`
- 用户丢弃后变为 `DISCARDED`

暂不支持：

- 候选间 diff 比较历史
- 候选合并
- 多候选排序优化

---

## 12. 权限设计

Phase A 所有文稿 AI 相关接口改为按项目角色判定：

- `VIEWER`：可查看候选与历史，不可生成，不可采纳
- `EDITOR`：可生成候选，可采纳候选
- `OWNER`：可生成、采纳，并可修改项目默认预设

若文稿未关联项目：

- 保持当前作者私有模型
- 仍允许原作者生成与采纳

这意味着文稿 AI 代码路径需要从“只认章节所属用户”升级为“优先看项目权限，否则退回个人所有权”。

---

## 13. 接口草案

## 13.1 Prompt 预设

- `GET /ai/presets`
- `POST /ai/presets`
- `GET /ai/presets/:id`
- `PUT /ai/presets/:id`
- `POST /ai/presets/:id/versions`
- `GET /ai/presets/:id/versions`
- `POST /ai/presets/:id/clone`

## 13.2 文稿 AI 生成

为减少迁移成本，Phase A 可以保留当前语义接口，但响应改为候选对象：

- `POST /manuscripts/chapters/:id/ai/continue`
- `POST /manuscripts/chapters/:id/ai/polish`
- `POST /manuscripts/chapters/:id/ai/expand`

请求建议增加：

- `presetId`
- `userInstruction`
- `selectedText`
- `overrideConfig`

其中 `overrideConfig` 在 Phase A 只先支持少量字段，例如：

- `temperature`
- `maxTokens`
- `contextLengthStrategy`

## 13.3 候选结果

- `GET /ai/candidates`
- `GET /ai/candidates/:id`
- `POST /ai/candidates/:id/apply`
- `POST /ai/candidates/:id/discard`

---

## 14. 前端设计

## 14.1 文稿编辑页改造

现有 AI 面板需要从“生成后立即可插入”改为“生成候选并显式采纳”。

建议界面结构：

- 任务类型切换：续写 / 润色 / 扩写
- 预设选择器
- 自定义要求输入框
- 上下文来源摘要
- 生成按钮
- 候选结果卡片
- 采纳按钮组

## 14.2 上下文来源展示

Phase A 不要求可视化到每一条字段，但至少展示：

- 角色设定数量
- 系统设定数量
- 世界设定数量
- 辅助设定数量
- 当前是否使用选中文本
- 当前上下文策略

## 14.3 候选采纳交互

采纳前：

- 展示候选内容
- 明确显示“这不是正文”

采纳后：

- 更新编辑器内容
- 更新本地正文版本号
- 候选卡片切换为“已采纳”

冲突时：

- 提示正文已被更新
- 保留候选内容
- 不自动覆盖编辑器

---

## 15. 迁移策略

## 15.1 后端迁移

按以下顺序推进：

1. 建立预设表、版本表、生成记录表、候选表
2. 写系统默认预设种子
3. 实现 `AiPromptModule`
4. 实现 `AiContextModule`
5. 实现 `AiGenerationModule`
6. 替换文稿服务中的续写、润色、扩写入口
7. 实现候选采纳接口

## 15.2 前端迁移

1. 调整文稿 AI 接口类型定义
2. 改造 AI 面板为候选模式
3. 增加预设选择器
4. 增加候选采纳按钮组
5. 处理版本冲突提示

## 15.3 兼容策略

Phase A 上线时不保留“生成结果直接进入正文”的旧交互。

原因：

- 同时保留两套心智会让权限、版本校验、追溯链路全部变复杂
- 候选优先是 V2 的核心约束，不应打折

---

## 16. 测试与验收

## 16.1 功能验收

- 项目默认预设可保存并在文稿 AI 中生效
- 三类文稿 AI 任务都能生成候选结果
- 候选结果可按四种模式采纳
- 采纳后生成记录、候选记录、正文版本历史能形成链路
- 正文版本冲突时不会发生静默覆盖

## 16.2 技术验收

- Prompt 预设版本可追溯
- 上下文来源清单可落库
- 协作权限符合 `OWNER / EDITOR / VIEWER` 规则
- 文稿服务不再直接拼 Prompt
- 同步 AI 接口统一返回候选对象

## 16.3 体验验收

- 用户能明确区分候选和正文
- 用户能知道本次生成用了什么预设和哪些上下文
- 用户在正文变化后不会误采纳过期候选

---

## 17. 推荐下一步

基于本文档，下一步建议继续拆三份更细的执行文档：

1. `V2.0 Prompt 预设表与接口设计`
2. `V2.0 上下文编排服务设计`
3. `V2.0 文稿候选结果与采纳接口设计`

如果只选一个先做，建议先拆“上下文编排服务设计”，因为它会决定预设变量格式、调用记录结构和文稿 AI 重构边界。
