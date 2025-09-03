# 墨阁

### 安装依赖

```bash
node -v # 18.18.0
npm install pnpm -g
pnpm install
```

### 添加版本到 catalog 中

```bash
# xxx 包名
# 等价 pnpm add --save-dev --workspace-root xxx --catalog
pnpm add -Dw xxx --catalog
```

### 在子包引用

```bash
# @moge/backend 是子包的名称
pnpm --filter @moge/backend add -D xxx@catalog:
```

### 子包使用 `packages/*` 共享包

```bash
# -F 等价于 --filter
# @moge/backend 是子包的名称
# @moge/utils 是共享包的名称
# 会自动生成 "dependencies": { "@moge/utils": "workspace:*" }
pnpm -F @moge/backend add @moge/utils
```

### 升级 / 删除 catalog 包

```bash
# 升级 catalog 里某个包，并自动更新所有引用
pnpm up xxx -r --catalog

# 从 catalog 里删除（手动删 yaml 后）
pnpm install --recursive
```

### 查看实际解析版本

```bash
# 看每个子包实际用的版本
pnpm why xxx -r
```
