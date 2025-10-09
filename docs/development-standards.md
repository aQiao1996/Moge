# 墨阁 (Moge) 开发文档

## AI开发规范

为确保代码质量和开发一致性，制定以下AI开发规范：

### 项目架构说明

本项目采用 **Monorepo 架构**，统一管理多个相关包：

- 📁 **apps/frontend** - Next.js前端应用，基于React 18 + TypeScript
- 📁 **apps/backend** - NestJS后端API服务，基于Node.js + TypeScript
- 📁 **packages/types** - 全局共享类型定义和Zod schema验证
- 📦 **包管理器**: 使用pnpm作为唯一包管理工具
- 🔧 **依赖管理**: 所有依赖版本通过`pnpm-workspace.yaml`统一管理
- 📋 **版本策略**: 子项目使用`catalog:`占位符引用workspace统一版本

**核心命令**：

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

### 核心开发规则

1. **依赖管理规范**：
   - 📦 **唯一包管理器**：必须使用pnpm，禁用npm/yarn
   - 🏢 **Workspace统一**：所有依赖版本在`pnpm-workspace.yaml`中统一管理
   - 🔖 **Catalog引用**：子项目package.json中使用`"dependency": "catalog:"`占位符
   - ⚠️ **禁止直接版本**：禁止在子项目中直接指定具体版本号
   - 🚫 **禁止重复安装**：不在子目录单独运行`pnpm install`

2. **Toast通知规范**：
   - ✅ **保留成功通知**：业务操作成功时使用 `toast.success()` 显示成功提示
   - ❌ **删除错误通知**：所有HTTP错误由 `request/index.ts` 全局处理，业务代码不应手动添加错误toast
   - 📝 **异常处理**：catch块中只保留 `console.error()` 用于调试，不显示用户错误提示

3. **代码质量检查**：
   - 🔧 **必须执行**：每次代码修改后在根目录执行 `pnpm run lint` 和 `pnpm run typecheck`
   - ✅ **通过标准**：代码必须通过所有lint和类型检查，无警告无错误
   - 🚫 **禁止提交**：有lint或类型错误的代码不得提交,不需要执行 `git` 相关操作

4. **注释与文档**：
   - 🈯 **中文注释**：所有代码注释必须使用中文，便于团队理解
   - 📖 **注释原则**：注释应解释"为什么"而不是"是什么"
   - 🚫 **避免无用注释**：禁止添加"简化版"、"直接使用XX"等无意义的状态描述注释
   - 🔤 **英文保留**：仅在技术术语、API名称等必要场景保留英文
   - 📝 **JSDoc标准**：公共函数、Service方法、API接口必须使用JSDoc格式
   - 🏷️ **分层注释**：核心层用完整JSDoc，业务层用简化JSDoc，实现层用行内注释
   - 🧠 **逻辑注释**：函数内部只有逻辑稍微复杂的地方才需要增加简单的中文注释
   - 📋 **必备要素**：JSDoc须包含功能描述、参数说明、返回值说明、异常情况（如适用）
   - 💬 **Props注释**：接口（Interface）或类型（Type）的字段应使用内联注释（`//`）说明其用途，尤其是在表单、对话框等复杂组件中。

5. **TypeScript类型规范**：
   - 🚫 **禁用 as any**：严禁使用 `as any` 绕过类型检查
   - ⚠️ **谨慎使用 unknown**：类型确实无法确定时可使用 `unknown`，但需添加类型保护
   - ✅ **类型安全**：优先使用精确的类型定义，必要时创建新的接口或类型别名
   - 🛡️ **类型保护**：使用类型守卫函数确保运行时类型安全
   - 📦 **共享类型**：全局类型定义统一放在`packages/types`中

6. **错误处理模式**：
   - 🎯 **统一处理**：依赖全局错误处理机制，避免重复的错误处理逻辑
   - 📝 **日志记录**：保留console.error用于开发调试和问题追踪
   - 🔄 **优雅降级**：确保错误不会导致页面崩溃，提供合理的备用方案

7. **AI协作规范**：
   - 🤖 **中文交流**：AI助手必须使用中文进行沟通和代码注释
   - 📋 **简洁回复**：回复要简洁直接，避免冗长的解释和总结，除非用户要求回答详细
   - 🎯 **任务导向**：专注解决具体问题，不进行不必要的扩展说明
   - 💡 **主动建议**：在发现代码问题时主动提出改进建议
   - ⚡ **快速响应**：优先快速解决问题，避免过度分析

8. **代码风格一致性**：
   - 🔍 **风格分析**：生成代码前先分析项目现有代码风格和模式
   - 📏 **格式统一**：遵循项目的缩进、命名、函数结构等风格规范
   - 🏗️ **架构一致**：使用项目既定的架构模式（如Prisma查询方式、错误处理模式等）
   - 🔄 **API设计**：保持与现有API接口设计的一致性
   - 📚 **依赖管理**：使用项目已有的库和工具，避免引入新的重复依赖

### 示例对比

**❌ 错误做法**：

```typescript
// 错误的错误处理
try {
  await apiCall();
} catch (error: any) {
  toast.error('操作失败'); // 重复的错误处理
  console.log(error); // 英文日志
}
```

```json
// 错误的依赖管理 - 子项目package.json
{
  "dependencies": {
    "react": "^18.2.0", // ❌ 直接指定版本
    "next": "14.0.0" // ❌ 直接指定版本
  }
}
```

```typescript
// 错误的AI协作示例
// This function handles user authentication
function handleAuth() {
  // TODO: implement this later
  return true;
}
// ❌ 英文注释，缺乏具体实现指导
```

```typescript
// 错误的代码风格示例 - 不一致的架构模式
async getStatistics() {
  // ❌ 使用原始SQL而非项目的Prisma风格
  return this.prisma.$queryRaw`
    SELECT "categoryCode", COUNT(*) as count
    FROM "dict_items" GROUP BY "categoryCode"
  `;
}
```

**✅ 正确做法**：

```typescript
// 正确的错误处理
try {
  await apiCall();
  toast.success('操作成功'); // 只保留成功提示
} catch (error) {
  console.error('操作失败:', error); // 中文日志，全局错误处理
}
```

```json
// 正确的依赖管理 - 子项目package.json
{
  "dependencies": {
    "react": "catalog:", // ✅ 使用catalog占位符
    "next": "catalog:" // ✅ 统一版本管理
  }
}
```

```typescript
// 正确的AI协作示例
/**
 * 处理用户认证逻辑
 * 验证JWT token有效性并返回用户信息
 */
async function handleAuth(token: string): Promise<UserInfo | null> {
  // 使用JWT验证库检查token有效性
  const decoded = await verifyToken(token);
  return decoded ? decoded.user : null;
}
// ✅ 中文注释，具体实现，明确返回类型
```

```typescript
// 正确的代码风格示例 - 遵循项目Prisma风格
async getStatistics(): Promise<{ categoryCode: string; count: number }[]> {
  // ✅ 使用Prisma标准API，与项目其他方法保持一致
  const results = await this.prisma.dict_items.groupBy({
    by: ['categoryCode'],
    _count: { id: true },
    orderBy: { categoryCode: 'asc' },
  });

  return results.map((result) => ({
    categoryCode: result.categoryCode,
    count: result._count.id,
  }));
}
```

```yaml
# pnpm-workspace.yaml - 统一版本管理
packages:
  - 'apps/*'
  - 'packages/*'

catalog:
  react: ^18.2.0
  next: 14.0.0
  typescript: ^5.0.0
```
