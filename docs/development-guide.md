# 开发指南

本文件定义了应用的核心架构、开发规范与当前进度。

---

## 1. 项目架构

### 技术栈

| 层级     | 技术                                         |
| -------- | -------------------------------------------- |
| 前端     | Next.js 14 + React 18 + Tailwind + shadcn/ui |
| 后端     | NestJS + Prisma + PostgreSQL                 |
| 类型     | @moge/types (Monorepo共享)                   |
| AI       | OpenAI API                                   |
| 时间处理 | dayjs (全局配置在 `lib/dayjs.ts`)            |

### 常用命令

```bash
pnpm run dev              # 启动所有服务
pnpm run lint             # 全量代码检查
pnpm run lint:changed     # 当前改动快速检查
pnpm run typecheck        # 类型检查
pnpm run test:e2e         # 后端 HTTP 级基础 E2E
pnpm --filter @moge/backend prisma studio  # 数据库可视化
```

---

## 2. 核心开发规则

1. **类型安全**: 严禁 `as any`、`@ts-ignore`、`eslint-disable`
2. **质量检查**: 每次修改后运行 `pnpm run lint && pnpm run typecheck`，开发中可先用 `pnpm run lint:changed` 快速自检
3. **三端统一**: 前端类型、后端接口、数据库字段必须完全对齐
4. **小步迭代**: 一次只解决一个问题,每步立即验证
5. **组件复用**: 优先使用已有UI组件(如 `MogeFormDialog`)
6. **时间处理**: 统一使用 `import dayjs from '@/lib/dayjs'`

---

## 3. 模块完成状态

| 模块       | 状态 | 核心功能                                         |
| ---------- | ---- | ------------------------------------------------ |
| 用户系统   | ✅   | 注册、登录、OAuth、个人中心                      |
| 设定集     | ✅   | 项目管理、四大设定CRUD、设定库                   |
| 字典管理   | ✅   | 分类管理、字典项CRUD、作用域、社区共享、版本历史 |
| 大纲       | ✅   | CRUD、卷章结构、AI生成、设定关联                 |
| 文稿       | ✅   | CRUD、卷章管理、编辑器、AI辅助                   |
| 工作台     | ✅   | 统计卡片、最近项目、待办、灵感便签               |
| 搜索/@引用 | ✅   | 统一搜索、@引用预览、反向链接                    |
| 导出       | ✅   | TXT/Markdown/EPUB/DOCX导出                       |

---

## 4. 核心功能完成度

### 🎯 核心API清单

**大纲模块**:

- `POST /outline` - 创建大纲
- `POST /outline/:id/generate` - AI流式生成大纲 (✅ 注入设定)
- `PUT /outline/:id/content` - 保存大纲内容

**文稿模块**:

- `POST /manuscripts` - 创建文稿
- `POST /manuscripts/from-outline/:id` - 从大纲创建文稿 (✅ 复制结构)
- `POST /manuscripts/chapters/:id/ai/continue` - AI续写 (✅ 注入设定)
- `POST /manuscripts/chapters/:id/ai/polish` - AI润色 (✅ 注入设定)
- `POST /manuscripts/chapters/:id/ai/expand` - AI扩写 (✅ 注入设定)
- `POST /manuscripts/chapters/:id/publish` - 发布章节
- `POST /manuscripts/chapters/:id/schedule-publish` - 定时发布章节
- `POST /manuscripts/chapters/:id/cancel-schedule` - 取消定时发布
- `POST /manuscripts/chapters/run-due-publish` - 执行到期定时发布
- `GET /manuscripts/chapters/:id/versions` - 获取版本历史
- `POST /manuscripts/chapters/:id/versions/:version/restore` - 恢复版本
- `GET /projects/:id/ai-config` - 获取项目级 AI 配置
- `PUT /projects/:id/ai-config` - 更新项目级 AI 配置
- `GET /projects/:id/members` - 获取项目协作成员
- `POST /projects/:id/members` - 添加或更新项目协作成员
- `PUT /projects/:id/members/:userId` - 更新项目协作成员角色
- `DELETE /projects/:id/members/:userId` - 移除项目协作成员

**导出模块**:

- `GET /export/manuscript/:id/txt` - 导出 TXT
- `GET /export/manuscript/:id/markdown` - 导出 Markdown
- `GET /export/manuscript/:id/epub` - 导出 EPUB
- `GET /export/manuscript/:id/docx` - 导出 DOCX

---

## 5. 数据库核心表

```
用户: users, accounts
设定: projects, character/system/world/misc_settings
大纲: outline, outline_content, outline_volume, outline_chapter, outline_chapter_content
文稿: manuscripts, manuscript_volume, manuscript_chapter, manuscript_chapter_content
协作: project_members
字典: dict_categories, dict_items, dict_item_versions
```

---

## 6. 关键设计决策

### @ 智能引用系统

- **触发**: 编辑器中输入 `@` 触发搜索
- **格式**: `[@设定名称](moge://type/id)`
- **已实现**:
  - 搜索和插入
  - 悬浮预览 (`MentionHoverCard.tsx`)
  - 跳转功能 (`MentionMarkdown.tsx`)
  - 反向链接 (`/search/backlinks` API + 设定库入口)

### 文稿模块架构

- **从大纲创建**: 自动复制卷章结构
- **AI辅助**: 续写、润色、扩写 (设定上下文注入)
- **自动保存**: 30秒或内容变更时
- **版本历史**:
  - 每次保存自动创建版本快照
  - 查看历史版本 (`ChapterVersionHistory.tsx`)
  - 恢复到任意版本
- **写作统计**:
  - 总字数、已发布字数统计
  - 章节发布进度追踪
  - 近30天趋势、活跃天数、项目贡献度分析
  - 最后编辑时间显示 (`WritingStats.tsx`)

### 工作台与字典

- **工作台**: 最近项目/大纲/文稿、今日待办、灵感便签；待办和便签复用内部辅助设定记录做用户级服务端持久化。
- **字典**: 支持系统/个人/项目级词条、社区共享、复制到个人字典、编辑版本历史，以及分类内 JSON 导入导出。
- **AI 配置**: 已提供项目级 AI 配置表与后端读写接口，支持模型、上下文来源、上下文长度策略、结果应用策略和后台任务阈值配置。
- **多格式导出**: 文稿支持 TXT、Markdown、EPUB、DOCX 四类导出。
- **定时发布**: 章节支持 `SCHEDULED` 状态、定时时间、到期发布执行接口，并通过后台定时任务每分钟自动发布到期章节。
- **协作权限**: 项目成员表支持 `OWNER`、`EDITOR`、`VIEWER` 角色，项目读写会按所有者和成员角色校验，并提供成员管理接口。

### 部署与安全

- **CORS**: 后端通过 `ALLOWED_ORIGINS` 控制允许来源，生产环境默认不放开全部来源。
- **限流**: 后端提供基础进程内限流，使用 `RATE_LIMIT_WINDOW_MS` 和 `RATE_LIMIT_MAX` 配置。
- **安全响应头**: 后端统一设置 `nosniff`、`DENY`、`no-referrer` 等基础响应头，并移除 `X-Powered-By`。
- **Swagger**: 生产 Docker 配置默认 `SWAGGER_ENABLED=false`；仅建议在受信网络内临时开启。
- **反向代理**: Docker 配置默认 `TRUST_PROXY=true`，用于代理部署时识别真实客户端 IP。
- **数据库**: Docker Compose 默认数据库连接为 `postgresql://moge:change_me_strong_password@localhost:5432/moge?schema=public`，本地后端环境参考 `apps/backend/.env.example`。
- **E2E**: `pnpm run test:e2e` 覆盖公开健康检查和 JWT 保护路由。

---

## 7. 下一步

1. **验证**: 启动服务,走完核心流程
2. **修复**: 根据验证结果修复问题
3. **优化**: 完善体验(可选)
