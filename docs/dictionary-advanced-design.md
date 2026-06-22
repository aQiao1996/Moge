# 字典高级能力设计

本文记录字典导入导出、社区共享、版本控制和分级权限的服务端落地方案。当前已通过 `20260622000100_dict_scopes_versions` 迁移实现系统级、用户级、项目级作用域，支持社区共享、复制和版本历史。

## 目标

- 支持系统级、用户级、项目级三种字典作用域。
- 支持用户将个人词条发布为社区共享词条。
- 支持词条编辑时保留版本历史，并可查看历史版本。
- 保持现有 `/dict?type=...` 读取方式向后兼容。

## 数据库变更

`dict_items` 已扩展作用域与共享字段，并新增版本表：

```prisma
enum DictScope {
  SYSTEM
  USER
  PROJECT
}

enum DictShareStatus {
  PRIVATE
  SHARED
  ARCHIVED
}

model dict_items {
  id           Int             @id @default(autoincrement())
  categoryCode String          @map("category_code")
  label        String
  value        String
  description  String?
  sortOrder    Int             @default(0) @map("sort_order")
  isEnabled    Boolean         @default(true) @map("is_enabled")
  scope        DictScope       @default(SYSTEM)
  userId       Int?            @map("user_id")
  projectId    Int?            @map("project_id")
  shareStatus  DictShareStatus @default(PRIVATE) @map("share_status")
  version      Int             @default(1)
  sourceItemId Int?            @map("source_item_id")
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  category     dict_categories @relation(fields: [categoryCode], references: [code], onDelete: Cascade)
  versions     dict_item_versions[]

  @@index([categoryCode, scope, userId, projectId])
  @@index([shareStatus])
}

model dict_item_versions {
  id          Int        @id @default(autoincrement())
  dictItemId  Int        @map("dict_item_id")
  version     Int
  label       String
  value       String
  description String?
  sortOrder   Int        @map("sort_order")
  isEnabled   Boolean    @map("is_enabled")
  createdAt   DateTime   @default(now()) @map("created_at")
  dictItem    dict_items @relation(fields: [dictItemId], references: [id], onDelete: Cascade)

  @@unique([dictItemId, version])
  @@index([dictItemId, version])
}
```

迁移策略：

- 现有词条默认迁移为 `scope = SYSTEM`、`shareStatus = PRIVATE`、`version = 1`。
- 保留现有 `categoryCode + value` 的系统级唯一性；用户级和项目级允许同 value 覆盖系统词条。
- 由于 PostgreSQL 对 `NULL` 唯一约束的语义，唯一性由 migration 中的 partial unique index 保障：
  - 系统级：`category_code + value where scope = SYSTEM`
  - 用户级：`category_code + value + user_id where scope = USER`
  - 项目级：`category_code + value + project_id where scope = PROJECT`
- 若未来需要管理员角色，应再接入用户角色表或权限表；当前项目暂无该结构。

## API 设计

- `GET /dict?type=novel_types&projectId=1`：返回系统词条、当前用户词条、指定项目词条，按项目级 > 用户级 > 系统级覆盖同 value。
- `POST /dict`：默认创建用户级词条；管理员创建系统级词条需后续权限体系支持。
- `PUT /dict/:id`：更新前写入 `dict_item_versions` 快照，主表 `version + 1`。
- `GET /dict/:id/versions`：查看词条版本历史。
- `POST /dict/:id/share`：将用户级词条标记为 `SHARED`。
- `POST /dict/:id/archive-share`：取消社区共享，将词条标记为 `ARCHIVED`。
- `POST /dict/:id/fork`：从共享词条复制为当前用户私有词条，并记录 `sourceItemId`。
- `GET /dict/community?type=...`：查询社区共享词条。

## 前端入口

- 字典分类页保留现有 CRUD、导入、导出、分享文件。
- 增加作用域筛选：全部、系统、个人、项目、社区。
- 词条卡片展示作用域、分享状态、版本号。
- 编辑词条时自动写入旧版本快照，版本历史用弹窗展示。
- 社区词条列表提供“复制到我的字典”。

## 风险与确认点

- 需要 Prisma schema 修改和 migration，属于项目规范里的数据库变更。
- 需要确认是否现在引入管理员/角色权限；如果不引入，系统级词条仍只由种子数据或后台脚本维护。
- 需要确认项目级词条是否绑定 `projects.id`，以及项目删除后是否级联删除项目级词条。

## 当前已完成能力

- 分类内 JSON 导入和导出。
- 导出文件包含 `version`、`permission`、`categoryCode`、`categoryTitle` 元数据。
- “分享文件”生成可分发 JSON 文件。
- 个人词条可发布到社区，社区词条可复制到个人字典。
- 词条编辑会保留版本快照，可查看历史版本。
- 系统词条只读，个人/项目词条按当前用户做权限校验。
