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
| 国际化   | next-intl (支持中英文切换)                   |
| 时间处理 | dayjs (全局配置在 `lib/dayjs.ts`)            |

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
6. **国际化规范**:
   - 所有用户可见文本必须使用 `useTranslations()`
   - 禁止硬编码中文或英文
   - AI 生成内容必须根据当前语言环境调整
7. **时间处理**: 统一使用 `import dayjs from '@/lib/dayjs'`

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
| 国际化     | 🚧   | next-intl 配置、中英文翻译       |

---

## 4. 核心功能完成度

### ✅ P0 - 核心流程（已完成）

| 流程       | 状态 | 实现位置                                                     |
| ---------- | ---- | ------------------------------------------------------------ |
| 设定→大纲  | ✅   | `outline.service.ts:158-176` - AI生成时正确注入设定上下文    |
| 大纲→文稿  | ✅   | `manuscripts.service.ts:55-129` - 完整复制卷章结构和设定关联 |
| 文稿AI续写 | ✅   | `manuscripts.service.ts:783-847` - 包含设定上下文注入        |
| 文稿AI润色 | ✅   | `manuscripts.service.ts:852-912` - 优化文本表达              |
| 文稿AI扩写 | ✅   | `manuscripts.service.ts:917-984` - 包含设定上下文注入        |
| 章节发布   | ✅   | `manuscripts.service.ts:498-562` - 支持单章/批量发布         |
| 版本历史   | ✅   | `manuscripts.service.ts:1037-1149` - 查看历史和版本恢复      |

### 🎯 核心API清单

**大纲模块**:

- `POST /outline` - 创建大纲
- `POST /outline/:id/generate` - AI流式生成大纲 (✅ 注入设定)
- `PUT /outline/:id/content` - 保存大纲内容

**文稿模块**:

- `POST /manuscripts` - 创建文稿
- `POST /manuscripts/from-outline/:id` - 从大纲创建文稿 (✅ 复制结构)
- `POST /manuscripts/chapters/:id/ai/continue` - AI续写 (✅ 注入设定)
- `POST /manuscripts/chapters/:id/ai/polish` - AI润色
- `POST /manuscripts/chapters/:id/ai/expand` - AI扩写 (✅ 注入设定)
- `POST /manuscripts/chapters/:id/publish` - 发布章节
- `GET /manuscripts/chapters/:id/versions` - 获取版本历史
- `POST /manuscripts/chapters/:id/versions/:version/restore` - 恢复版本

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

## 7. 国际化 (i18n) 规范

### 技术方案

- **框架**: next-intl (Next.js 官方推荐)
- **支持语言**: 中文(zh)、英文(en)
- **翻译文件**: `messages/zh.json` 和 `messages/en.json`
- **语言切换**: 基于 cookie，与 zustand store 同步

### 使用规范

#### 1. 组件中使用翻译

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('manuscripts'); // 命名空间

  return (
    <div>
      <h1>{t('title')}</h1>
      <Button>{t('createNew')}</Button>
    </div>
  );
}
```

#### 2. 服务端组件使用翻译

```typescript
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations('manuscripts');

  return <h1>{t('title')}</h1>;
}
```

#### 3. 翻译文件结构

```json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除"
  },
  "manuscripts": {
    "title": "我的文稿",
    "createNew": "新建文稿"
  }
}
```

**命名规范**:

- 使用嵌套结构按模块组织
- 键名使用 camelCase
- 避免过深的嵌套（最多3层）

#### 4. AI 生成内容的语言适配

所有调用 AI 的地方，必须根据当前语言设置调整 prompt：

```typescript
import { useTranslations } from 'next-intl';
import { useSettings } from '@/stores/settingStore';

export default function AIComponent() {
  const t = useTranslations('ai');
  const { lang } = useSettings();

  const generateContent = async () => {
    const prompt = lang === 'zh' ? `请用中文生成...` : `Please generate in English...`;

    // 或使用翻译键
    const prompt = t('generatePrompt', { context: '...' });

    await callAI(prompt);
  };
}
```

**AI 调用点清单**（必须适配语言）:

- 大纲生成 (`outline/generate`)
- 章节续写 (`manuscripts/ai-continue`)
- 内容润色 (`manuscripts/ai-polish`)
- 内容扩写 (`manuscripts/ai-expand`)

#### 5. 日期和数字格式化

虽然 dayjs 已配置中文，但需注意：

```typescript
import dayjs from '@/lib/dayjs';
import { useFormatter } from 'next-intl';

export default function Component() {
  const format = useFormatter();

  // 日期格式化（已自动适配中文）
  const time = dayjs().fromNow(); // "几秒前"

  // 数字格式化（使用 next-intl）
  const number = format.number(12345.67, {
    style: 'currency',
    currency: 'CNY',
  });
}
```

### 开发流程

1. **添加新文本**
   - 在 `messages/zh.json` 和 `messages/en.json` 中同时添加翻译键
   - 确保两个文件的键名完全一致

2. **修改组件**
   - 用 `t('key')` 替换所有硬编码文本
   - AI 调用时根据 `lang` 调整 prompt

3. **验证**
   - 切换语言测试所有功能
   - 确保 AI 生成内容符合当前语言

4. **类型安全**
   - 翻译消息类型定义在 `src/i18n/messages.type.ts`
   - 必须继承 `AbstractIntlMessages` 以满足 next-intl 类型要求
   - 添加新命名空间时同步更新类型定义

### 注意事项

⚠️ **禁止事项**:

- ❌ 硬编码中文或英文字符串
- ❌ 使用字符串拼接构建句子（不同语言语序不同）
- ❌ AI 生成时忽略语言设置

✅ **最佳实践**:

- ✅ 所有文本通过翻译键管理
- ✅ 使用插值处理动态内容: `t('welcome', { name })`
- ✅ AI prompt 根据语言环境动态生成
- ✅ 复数、性别等使用 next-intl 提供的功能

---

## 8. 下一步

1. **验证**: 启动服务,走完核心流程
2. **修复**: 根据验证结果修复问题
3. **优化**: 完善体验(可选)
