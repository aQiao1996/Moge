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

```typescript
// 错误的类型规范 - 使用注释绕过检查
// @ts-ignore
const result = someFunction(wrongType); // ❌ 隐藏类型错误

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function badFunction(param: any) {
  // ❌ 绕过lint规则
  return param.someProperty;
}

// @ts-nocheck  // ❌ 忽略整个文件的检查
export function unsafeCode() {
  // 随意编写不安全的代码
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

```typescript
// 错误的接口开发示例 - 未检查数据库字段对应关系
// packages/types/src/schemas/system.ts
export const systemTypes = [
  { value: 'upgrade', label: '升级系统' },
  { value: 'signin', label: '签到系统' },
  { value: 'cultivation', label: '修炼系统' },
  // ❌ 缺少 'cultivation_aid'，但数据库中存储了这个值
] as const;

// 前端组件
<Select value={system.type}> {/* ❌ 无法回显 'cultivation_aid' */}
  {systemTypes.map(t => <Option value={t.value}>{t.label}</Option>)}
</Select>
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

```typescript
// 正确的类型规范 - 从根本上解决类型问题
// ✅ 创建精确的类型定义
interface FunctionParams {
  id: number;
  name: string;
}

interface FunctionResult {
  success: boolean;
  data: string;
}

function goodFunction(param: FunctionParams): FunctionResult {
  return {
    success: true,
    data: param.name,
  };
}

// ✅ 使用类型守卫处理不确定类型
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return '未知类型';
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

```typescript
// 正确的接口开发示例 - 三端字段统一
// 1. 先查看 apps/backend/prisma/schema.prisma
model system_settings {
  id          Int      @id @default(autoincrement())
  type        String   // ✅ 查看数据库字段类型
  // ...
}

// 2. 查询数据库实际存储的值
// SELECT DISTINCT type FROM system_settings;
// 结果: 'cultivation', 'cultivation_aid', 'upgrade' ...

// 3. 确保前端类型定义包含所有数据库值
// packages/types/src/schemas/system.ts
export const systemTypes = [
  { value: 'upgrade', label: '升级系统' },
  { value: 'signin', label: '签到系统' },
  { value: 'cultivation', label: '修炼系统' },
  { value: 'cultivation_aid', label: '修炼辅助系统' }, // ✅ 添加缺失值
] as const;

// 4. 前端组件正确存储value
<MogeSelect
  value={field.value as string}
  onValueChange={field.onChange}  // ✅ 存储value，不是label
>
  {systemTypes.map(type => (
    <MogeSelectItem key={type.value} value={type.value}>
      {type.label}
    </MogeSelectItem>
  ))}
</MogeSelect>
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

```typescript
// 错误的修改范围控制 - 顺手优化无关代码
async function updateUser(id: number, data: UpdateUserDto) {
  // ❌ 任务只要求修改用户更新逻辑，但顺手重构了验证函数
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return this.prisma.user.update({ where: { id }, data });
}
```

```typescript
// 错误的危险操作 - 没有确认直接删除
async function cleanupOldData() {
  // ❌ 直接删除数据，没有确认和备份
  await this.prisma.old_records.deleteMany({
    where: { createdAt: { lt: new Date('2023-01-01') } },
  });
}
```

```typescript
// 错误的数据库安全 - SQL注入风险
async function searchUsers(keyword: string) {
  // ❌ 字符串拼接SQL，存在注入风险
  return this.prisma.$queryRawUnsafe(`SELECT * FROM users WHERE name LIKE '%${keyword}%'`);
}
```

```typescript
// 错误的用户体验 - 缺少loading状态
async function handleSubmit() {
  // ❌ 没有loading状态，用户不知道是否在处理
  const result = await createUser(formData);
  toast.success('创建成功');
}
```

**✅ 正确做法（新增规范示例）**：

```typescript
// 正确的修改范围控制 - 只改相关代码
async function updateUser(id: number, data: UpdateUserDto) {
  // ✅ 只修改本次任务相关的更新逻辑，不改其他无关代码
  return this.prisma.user.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(), // 只添加本次任务需要的字段
    },
  });
}
```

```typescript
// 正确的危险操作 - 明确确认和说明
async function cleanupOldData() {
  // ✅ 先列出影响范围
  const count = await this.prisma.old_records.count({
    where: { createdAt: { lt: new Date('2023-01-01') } },
  });

  // 告知用户: "将删除 {count} 条2023年前的记录，此操作不可逆，是否继续?"
  // 等待用户确认后再执行
  await this.prisma.old_records.deleteMany({
    where: { createdAt: { lt: new Date('2023-01-01') } },
  });
}
```

```typescript
// 正确的数据库安全 - 使用参数化查询
async function searchUsers(keyword: string) {
  // ✅ 使用Prisma安全查询，自动防注入
  return this.prisma.user.findMany({
    where: {
      name: {
        contains: keyword,
        mode: 'insensitive',
      },
    },
  });
}
```

```typescript
// 正确的用户体验 - 有loading状态和错误处理
async function handleSubmit() {
  // ✅ 显示loading状态
  setLoading(true);
  try {
    const result = await createUser(formData);
    toast.success('创建成功');
  } catch (error) {
    console.error('创建用户失败:', error);
    // 全局错误处理会显示具体错误
  } finally {
    setLoading(false);
  }
}
```

```typescript
// 正确的增量开发 - 小步迭代
// ❌ 错误:一次性实现整个用户管理模块(创建+编辑+删除+列表+搜索+导出)
// ✅ 正确:
// 第1步: 实现用户列表查询 → 验证lint/typecheck → 测试
// 第2步: 实现用户创建功能 → 验证 → 测试
// 第3步: 实现用户编辑功能 → 验证 → 测试
// 第4步: 实现用户删除功能 → 验证 → 测试
// 每步独立可回滚，出问题容易定位
```

```typescript
// 正确的API变更 - 保持向后兼容
// ❌ 错误: 直接修改现有API
interface UserResponse {
  name: string;
  avatar: string; // 直接改字段名会破坏前端
}

// ✅ 正确: 保持兼容或提供过渡期
interface UserResponse {
  name: string;
  avatar: string; // 保留旧字段
  avatarUrl: string; // 新增新字段
  // @deprecated 使用avatarUrl代替，将在v2.0移除
}
```

```typescript
// 正确的任务完成标准 - 完整验证清单
/**
 * 任务: 添加用户导出功能
 *
 * 完成清单:
 * [x] pnpm run lint 通过
 * [x] pnpm run typecheck 通过
 * [x] 测试正常导出(100条数据)
 * [x] 测试大数据量导出(10000条)
 * [x] 测试空数据导出
 * [x] 测试导出权限验证
 * [x] API接口JSDoc注释已添加
 * [x] 前端loading状态已实现
 * [x] 无console.log遗留
 */
```
