# 墨阁 (Moge) AI开发规范

> 为确保代码质量和开发一致性，制定以下AI开发规范

## 📚 规范导航

| 规范模块               | 说明                                                                   | 文档链接                                             |
| ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- |
| **核心开发规则**       | 依赖管理、Toast通知、质量检查、注释文档、类型规范、错误处理 (规范1-6)  | [core-rules.md](./standards/core-rules.md)           |
| **AI协作与代码风格**   | AI协作规范、代码风格一致性 (规范7-8)                                   | [collaboration.md](./standards/collaboration.md)     |
| **接口开发与安全**     | 接口开发、修改范围、危险操作、增量开发、数据库安全、API变更 (规范9-14) | [api-development.md](./standards/api-development.md) |
| **性能优化与用户体验** | 性能优化意识、用户体验规范、代码完整性 (规范15-17)                     | [performance-ux.md](./standards/performance-ux.md)   |
| **任务完成标准**       | 任务完成标准、AI响应规范 (规范18-19)                                   | [task-completion.md](./standards/task-completion.md) |
| **示例对比**           | 所有规范的错误与正确示例代码                                           | [examples.md](./standards/examples.md)               |

## 📁 项目架构

本项目采用 **Monorepo 架构**，统一管理多个相关包：

- 📁 **apps/frontend** - Next.js前端应用，基于React 18 + TypeScript
- 📁 **apps/backend** - NestJS后端API服务，基于Node.js + TypeScript
- 📁 **packages/types** - 全局共享类型定义和Zod schema验证
- 📦 **包管理器**: 使用pnpm作为唯一包管理工具
- 🔧 **依赖管理**: 所有依赖版本通过`pnpm-workspace.yaml`统一管理
- 📋 **版本策略**: 子项目使用`catalog:`占位符引用workspace统一版本

### 核心命令

```bash
# 根目录安装所有依赖
pnpm install

# 在特定workspace运行命令
pnpm --filter @moge/frontend dev
pnpm --filter @moge/backend dev

# 全局命令（在根目录）
pnpm run dev        # 启动所有服务
pnpm run build      # 构建所有项目
pnpm run lint       # 检查所有代码
pnpm run typecheck  # 类型检查所有项目
```

## ⚡ 最重要的5条规范（必读）

### 1. 代码质量检查

每次代码修改后必须执行：

```bash
pnpm run lint       # 必须通过，无警告无错误
pnpm run typecheck  # 必须通过
```

### 2. TypeScript类型安全

- 🚫 严禁使用 `as any` 绕过类型检查
- 🔒 严禁使用 `// @ts-ignore`、`// @ts-nocheck`、`// eslint-disable` 等注释
- ✅ 从根本上解决类型问题，不隐藏错误

### 3. 接口开发三端统一

开发接口前必须：

1. 查看 `apps/backend/prisma/schema.prisma` 了解数据库表结构
2. 确保前端类型定义、后端接口、数据库字段完全对应
3. Select/Enum字段的值必须与数据库存储的实际值完全一致
4. Select组件存储 `value` 而非 `label`

### 4. 危险操作确认机制

以下操作必须先确认：

- 🗑️ 文件删除：列出文件列表并等待确认
- 💾 数据库操作：执行migration、数据删除、字段变更前明确说明
- 🚨 不可逆操作：删除、覆盖、重置需明确警告

### 5. 增量开发原则

- 📦 小步迭代，一次只解决一个问题
- ✅ 每个改动后立即验证（lint/typecheck/功能测试）
- 🔙 保持每次修改都可以独立回滚

## 🎯 规范快速查询

### 需要修改代码时

→ 查看 [修改范围控制](./standards/api-development.md#10-代码修改范围控制)
→ 查看 [增量开发原则](./standards/api-development.md#12-增量开发原则)

### 需要开发接口时

→ 查看 [接口开发规范](./standards/api-development.md#9-接口开发规范)
→ 查看 [数据库安全规范](./standards/api-development.md#13-数据库安全规范)
→ 查看 [三端统一示例](./standards/examples.md)

### 需要修改API时

→ 查看 [API变更规范](./standards/api-development.md#14-api变更规范)

### 遇到类型错误时

→ 查看 [TypeScript类型规范](./standards/core-rules.md#5-typescript类型规范)
→ 查看 [类型安全示例](./standards/examples.md)

### 需要删除/重命名文件时

→ 查看 [危险操作确认机制](./standards/api-development.md#11-危险操作确认机制)

### 任务完成前

→ 查看 [任务完成标准清单](./standards/task-completion.md#18-任务完成标准)

## 📖 完整规范列表

<details>
<summary>点击展开19条规范概览</summary>

### 核心开发规则 (1-6)

1. 依赖管理规范
2. Toast通知规范
3. 代码质量检查
4. 注释与文档
5. TypeScript类型规范
6. 错误处理模式

### AI协作与代码风格 (7-8)

7. AI协作规范
8. 代码风格一致性

### 接口开发与安全 (9-14)

9. 接口开发规范
10. 代码修改范围控制
11. 危险操作确认机制
12. 增量开发原则
13. 数据库安全规范
14. API变更规范

### 性能优化与用户体验 (15-17)

15. 性能优化意识
16. 用户体验规范
17. 代码完整性

### 任务完成标准 (18-19)

18. 任务完成标准
19. AI响应规范

</details>

## 🔍 使用建议

- **AI助手**：按需读取相关规范模块，避免一次性加载全部文档
- **开发者**：建议先阅读"最重要的5条规范"，然后根据实际开发场景查阅对应模块
- **示例参考**：遇到具体问题时，直接查看 [examples.md](./standards/examples.md) 中的代码示例

---

**备注**：原完整文档已备份至 `development-standards-backup.md`
