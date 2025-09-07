前端项目

- 本项目 ui 库是 [shadcn ui](https://ui.shadcn.com/)。
- 增加 `shadcn ui` 组件。

```bash
cd apps/frontend
npx shadcn@latest add xxx # 会自动存放到 @/components/ui
# 如果遇见报错找不到 src/app/globals.css ,可以手动创建,然后手动移植到 src/styles/index.css
```
