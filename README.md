# 墨阁

### 安装依赖

```bash
node -v # >=18.18.0
npm install pnpm -g
pnpm -v # >=10.5.0
pnpm install
```

### 添加/管理依赖

推荐使用以下一步到位的命令来为子包添加依赖，它会自动更新 `pnpm-workspace.yaml` 中的 `catalog`。

```bash
# 语法: pnpm --filter <package-name> add <dependency-name> --save-catalog

# 示例: 为 backend 添加一个新的生产依赖
pnpm --filter @moge/backend add lodash --save-catalog

# 示例: 为 frontend 添加一个新的开发依赖
pnpm --filter @moge/frontend add -D @types/lodash --save-catalog
```

---

#### 其他常用命令

<details>
<summary>点击展开查看更多</summary>

**使用 Catalog 中已有的依赖**

如果某个依赖版本已经存在于 `pnpm-workspace.yaml` 的 `catalog` 中，你可以使用 `@catalog:` 关键字将其添加到子包。

```bash
# 示例: 为 frontend 添加 catalog 中已有的 sonner
pnpm --filter @moge/frontend add sonner@catalog:
```

**添加项目级开发工具 (到根目录)**

对于 `eslint`, `prettier`, `husky` 等在整个项目范围内使用的开发工具，应将其安装到根目录。

```bash
# -w 表示 --workspace-root
pnpm add -Dw <tool-name> --save-catalog
```

**子包使用 `packages/*` 共享包**

```bash
# -F 等价于 --filter
# @moge/backend 是子包的名称
# @moge/types 是共享包的名称
# "workspace:*" 协议表示这个包来自当前 monorepo 的 workspace
pnpm -F @moge/backend add '@moge/types@workspace:*'
```

**升级 / 删除 catalog 包**

```bash
# 升级 catalog 里某个包，并自动更新所有引用它的子包
pnpm up <dependency-name> -r --catalog

# 从 catalog 里删除包，需要两步:
# 1. 手动从 pnpm-workspace.yaml 中删除对应的行
# 2. 执行 pnpm install
```

**查看实际解析版本**

```bash
# 查看 xxx 包在每个子包中实际使用的版本
pnpm why <dependency-name> -r
```

</details>
