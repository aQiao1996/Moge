# 开发指南

本文件定义了应用的核心架构、开发规范与当前进度。

---

## 1. 项目架构

### 技术栈

| 层级 | 技术                                         |
| ---- | -------------------------------------------- |
| 前端 | Next.js 14 + React 18 + Tailwind + shadcn/ui |
| 后端 | NestJS + Prisma + PostgreSQL                 |
| 类型 | @moge/types (Monorepo共享)                   |
| AI   | OpenAI API                                   |

### 常用命令

```bash
pnpm run dev              # 启动所有服务
pnpm run lint             # 代码检查
pnpm run typecheck        # 类型检查
pnpm --filter @moge/backend prisma studio  # 数据库可视化
```

---

## 2. 核心开发规则

1. **类型安全**: 严禁 `as any`、`@ts-ignore`、`eslint-disable`
2. **质量检查**: 每次修改后运行 `pnpm run lint && pnpm run typecheck`
3. **三端统一**: 前端类型、后端接口、数据库字段必须完全对齐
4. **小步迭代**: 一次只解决一个问题,每步立即验证
5. **组件复用**: 优先使用已有UI组件(如 `MogeFormDialog`)

---

## 3. 模块完成状态

| 模块       | 状态 | 核心功能                         |
| ---------- | ---- | -------------------------------- |
| 用户系统   | ✅   | 注册、登录、OAuth、个人中心      |
| 设定集     | ✅   | 项目管理、四大设定CRUD、设定库   |
| 字典管理   | ✅   | 分类管理、字典项CRUD             |
| 大纲       | ✅   | CRUD、卷章结构、AI生成、设定关联 |
| 文稿       | ✅   | CRUD、卷章管理、编辑器、AI辅助   |
| 工作台     | ✅   | 统计卡片、最近项目、快速创建     |
| 搜索/@引用 | ✅   | 统一搜索、@引用基础功能          |
| 导出       | ✅   | TXT/Markdown导出                 |

---

## 4. 待验证/待完成

### P0 - 核心流程验证

| 流程      | 验证点                                                  |
| --------- | ------------------------------------------------------- |
| 设定→大纲 | AI生成时设定上下文注入是否正确                          |
| 大纲→文稿 | `POST /manuscripts/from-outline/:id` 卷章结构和内容迁移 |
| 文稿编辑  | 自动保存、AI续写/润色/扩写、@引用                       |
| 导出发布  | 章节发布、单章/整书导出                                 |

### P1 - 体验优化 ✅

- ✅ @引用悬浮预览 (`MentionHoverCard.tsx`)
- ✅ @引用跳转 (`MentionMarkdown.tsx`)
- ✅ 反向链接 (`GET /search/backlinks`)
- ✅ 版本历史UI (`ChapterVersionHistory.tsx` + API)
- ✅ 统计趋势图 (`WritingStats.tsx` - 写作统计卡片)

### P2 - 高级功能 (后续迭代)

- EPUB/DOCX导出、定时发布、灵感便签、创作目标

---

## 5. 数据库核心表

```
用户: users, accounts
设定: projects, character/system/world/misc_settings
大纲: outline, outline_content, outline_volume, outline_chapter, outline_chapter_content
文稿: manuscripts, manuscript_volume, manuscript_chapter, manuscript_chapter_content
字典: dict_categories, dict_items
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
  - 反向链接 (`/search/backlinks` API)

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
  - 最后编辑时间显示 (`WritingStats.tsx`)

---

## 7. 下一步

1. **验证**: 启动服务,走完核心流程
2. **修复**: 根据验证结果修复问题
3. **优化**: 完善体验(可选)
