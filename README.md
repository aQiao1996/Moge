墨阁

# 安装依赖

## 添加版本到 catalog 中

- pnpm add -Dw xxx --catalog
  > 等价 pnpm add --save-dev --workspace-root xxx --catalog

## 在子包引用

- pnpm --filter @app/backend add -D xxx@catalog:
  > @app/backend 是子包的名称
