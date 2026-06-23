# 墨阁项目开发指引

在开始任何开发任务前，请务必阅读项目开发规范：

📖 **开发规范索引**: `docs/development-standards.md`

## 核心要求

1. **必读规范**：启动后先查看 `docs/development-standards.md` 了解规范导航
2. **按需查阅**：根据任务类型，查阅对应的详细规范模块：
   - 核心规则：`docs/standards/core-rules.md`
   - 接口开发：`docs/standards/api-development.md`
   - 示例参考：`docs/standards/examples.md`

3. **最关键的5条规范**：
   - ✅ 每次修改后运行 `pnpm run lint` 和 `pnpm run typecheck`，其中 `pnpm run lint` 为全量检查，开发中可先用 `pnpm run lint:changed` 快速自检
   - 🚫 严禁使用 `as any`、`@ts-ignore`、`eslint-disable`
   - 🗄️ 开发接口前先查看 `apps/backend/prisma/schema.prisma`
   - 🚨 危险操作（删除/数据库变更）必须先确认
   - 📦 小步迭代，每步立即验证

## 项目架构

- **Monorepo**: 使用 pnpm workspace 管理
- **前端**: Next.js + React 18 + TypeScript (apps/frontend)
- **后端**: NestJS + Prisma (apps/backend)
- **类型**: 共享类型定义 (packages/types)
- **包管理**: 只用 pnpm，版本统一在 `pnpm-workspace.yaml`

## 工作流程

1. 收到任务 → 先查看 `docs/development-standards.md` 了解规范导航
2. 根据任务类型 → 查阅对应的详细规范模块；如涉及接口，先查看 `docs/standards/api-development.md` 和 `apps/backend/prisma/schema.prisma`
3. 开始开发前 → 先确认影响范围与风险；如涉及删除、数据库变更等危险操作，必须先征得确认
4. 开始开发 → 遵循规范实施，保持小步迭代，每步立即验证
5. 完成开发 → 运行 `pnpm run lint` + `pnpm run typecheck`，并补充必要的功能测试、注释和文档更新
6. 提交前 → 对照任务完成标准清单逐项检查，确认任务已完整收口
7. 确认完成后 → 根据下方任务总结格式，选择对应 type 并输出任务总结

## 任务总结格式

完成工作后，选择匹配的变更类型，并按 `✨ feat：谈话教育工作台页改版` 格式提供任务总结，其中前缀为 `emoji + type + 全角冒号`，`：` 后的中文总结为 15-20 个字符：

- `🎉 init`: 初始化项目
- `🔧 build`: 构建相关
- `🐳 chore`: 辅助工具变动
- `🐎 ci`: 自动化构建
- `📃 docs`: 文档
- `✨ feat`: 新功能
- `🐞 fix`: 修复问题
- `🌈 style`: 样式或格式调整
- `🦄 refactor`: 重构
- `🧪 test`: 测试相关
- `↩ revert`: 回滚
- `🎈 perf`: 性能优化

---

**规范文档结构**：详见 `docs/development-standards.md`
