# 文稿模块数据库设计说明

## 📊 数据表结构

### 1. manuscripts (文稿表)

文稿的核心元数据表。

#### 关键字段说明

##### 设定关联策略 ⚠️ 重要

文稿支持两种方式关联设定:

**方式一: 通过项目关联 (推荐)**

```typescript
{
  projectId: 123,  // 关联设定集项目
  characters: [],  // 忽略
  systems: [],     // 忽略
  worlds: [],      // 忽略
  misc: []        // 忽略
}
```

**方式二: 直接关联设定 (灵活)**

```typescript
{
  projectId: null,           // 不关联项目
  characters: ['1', '2'],   // 直接选择角色
  systems: ['1'],           // 直接选择系统
  worlds: ['1'],            // 直接选择世界
  misc: []                  // 直接选择辅助
}
```

**业务规则**:

- 如果 `projectId` 不为空,则优先使用项目关联的设定
- 如果 `projectId` 为空,则使用四个数组字段
- 后端获取设定时的逻辑:
  ```typescript
  function getManuscriptSettings(manuscript) {
    if (manuscript.projectId) {
      // 通过 projectId 获取项目,然后获取项目的设定
      const project = await getProject(manuscript.projectId);
      return {
        characters: project.characters,
        systems: project.systems,
        worlds: project.worlds,
        misc: project.misc,
      };
    } else {
      // 直接使用文稿的设定数组
      return {
        characters: manuscript.characters,
        systems: manuscript.systems,
        worlds: manuscript.worlds,
        misc: manuscript.misc,
      };
    }
  }
  ```

##### outlineId (大纲来源记录)

- **不是外键关联**: 仅用于记录"这个文稿是从哪个大纲创建的"
- **独立性**: 大纲删除不影响文稿
- **创建流程**:
  1. 用户点击"从大纲创建文稿"
  2. 系统复制大纲的卷章结构到文稿
  3. 记录 `outlineId = 大纲ID`
  4. 之后文稿和大纲完全独立

##### 字数字段 (totalWords, publishedWords)

这些是冗余字段,需要在后端自动维护:

**更新时机**:

- 保存章节内容时
- 发布章节时
- 删除章节时

**计算逻辑**:

```typescript
// 1. 保存章节内容时
async saveChapterContent(chapterId, content) {
  const wordCount = calculateWordCount(content);

  // 更新章节字数
  await prisma.manuscript_chapter.update({
    where: { id: chapterId },
    data: { wordCount }
  });

  // 重新计算文稿总字数
  const manuscript = await prisma.manuscripts.findFirst({
    where: {
      OR: [
        { chapters: { some: { id: chapterId } } },
        { volumes: { some: { chapters: { some: { id: chapterId } } } } }
      ]
    },
    include: {
      chapters: true,
      volumes: { include: { chapters: true } }
    }
  });

  const totalWords = calculateTotalWords(manuscript);
  const publishedWords = calculatePublishedWords(manuscript);

  await prisma.manuscripts.update({
    where: { id: manuscript.id },
    data: { totalWords, publishedWords }
  });
}

// 2. 计算总字数
function calculateTotalWords(manuscript) {
  let total = 0;

  // 无卷章节
  manuscript.chapters.forEach(ch => {
    total += ch.wordCount;
  });

  // 卷内章节
  manuscript.volumes.forEach(vol => {
    vol.chapters.forEach(ch => {
      total += ch.wordCount;
    });
  });

  return total;
}

// 3. 计算已发布字数
function calculatePublishedWords(manuscript) {
  let total = 0;

  manuscript.chapters.forEach(ch => {
    if (ch.status === 'PUBLISHED') {
      total += ch.wordCount;
    }
  });

  manuscript.volumes.forEach(vol => {
    vol.chapters.forEach(ch => {
      if (ch.status === 'PUBLISHED') {
        total += ch.wordCount;
      }
    });
  });

  return total;
}
```

##### lastEditedChapterId / lastEditedAt (最后编辑记录)

用于提升用户体验:

**使用场景**:

- 用户打开文稿时,自动跳转到上次编辑的章节
- 在文稿列表显示"上次编辑于 2小时前"

**更新时机**:

```typescript
// 用户打开章节编辑器时
async openChapterEditor(manuscriptId, chapterId) {
  await prisma.manuscripts.update({
    where: { id: manuscriptId },
    data: {
      lastEditedChapterId: chapterId,
      lastEditedAt: new Date()
    }
  });
}
```

##### deletedAt (软删除)

- `deletedAt = null`: 正常文稿
- `deletedAt != null`: 已删除文稿

**查询示例**:

```typescript
// 查询用户的所有未删除文稿
const manuscripts = await prisma.manuscripts.findMany({
  where: {
    userId: currentUserId,
    deletedAt: null, // 只查询未删除的
  },
});

// 软删除文稿
await prisma.manuscripts.update({
  where: { id: manuscriptId },
  data: { deletedAt: new Date() },
});

// 恢复文稿
await prisma.manuscripts.update({
  where: { id: manuscriptId },
  data: { deletedAt: null },
});

// 永久删除 (谨慎使用)
await prisma.manuscripts.delete({
  where: { id: manuscriptId },
});
```

---

### 2. manuscript_volume (文稿卷表)

与 `outline_volume` 结构一致。

#### sortOrder 字段使用

使用 `Decimal(10, 5)` 类型支持灵活排序:

**插入章节示例**:

```typescript
// 在第1卷和第2卷之间插入新卷
const volume1 = await prisma.manuscript_volume.findFirst({
  where: { manuscriptId, sortOrder: 1.0 },
});
const volume2 = await prisma.manuscript_volume.findFirst({
  where: { manuscriptId, sortOrder: 2.0 },
});

// 新卷的 sortOrder = (1.0 + 2.0) / 2 = 1.5
await prisma.manuscript_volume.create({
  data: {
    manuscriptId,
    title: '新卷',
    sortOrder: 1.5,
  },
});
```

**定期重排序** (防止精度不够):

```typescript
// 每隔一段时间或手动触发
async function reorderVolumes(manuscriptId) {
  const volumes = await prisma.manuscript_volume.findMany({
    where: { manuscriptId },
    orderBy: { sortOrder: 'asc' },
  });

  // 重新分配为 1.0, 2.0, 3.0...
  for (let i = 0; i < volumes.length; i++) {
    await prisma.manuscript_volume.update({
      where: { id: volumes[i].id },
      data: { sortOrder: i + 1.0 },
    });
  }
}
```

---

### 3. manuscript_chapter (文稿章节表)

#### 章节挂载方式

支持两种挂载:

**方式一: 无卷章节** (序章、后记)

```typescript
{
  manuscriptId: 123,
  volumeId: null,
  title: '序章',
  sortOrder: 0.5  // 在所有卷之前
}
```

**方式二: 卷内章节**

```typescript
{
  manuscriptId: null,
  volumeId: 456,
  title: '第一章',
  sortOrder: 1.0
}
```

#### status (章节状态)

- `DRAFT`: 草稿 - 未发布
- `PUBLISHED`: 已发布

**发布流程**:

```typescript
async publishChapter(chapterId) {
  await prisma.manuscript_chapter.update({
    where: { id: chapterId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date()  // 记录首次发布时间
    }
  });

  // 重新计算文稿的已发布字数
  await recalculatePublishedWords(manuscriptId);
}
```

---

### 4. manuscript_chapter_content (章节内容表)

#### 版本管理

每次保存章节内容时:

```typescript
async saveContent(chapterId, newContent) {
  // 1. 获取当前内容
  const current = await prisma.manuscript_chapter_content.findUnique({
    where: { chapterId }
  });

  if (current) {
    // 2. 保存当前版本到历史表
    await prisma.manuscript_chapter_content_version.create({
      data: {
        contentId: current.id,
        version: current.version,
        content: current.content
      }
    });

    // 3. 更新内容并递增版本号
    await prisma.manuscript_chapter_content.update({
      where: { chapterId },
      data: {
        content: newContent,
        version: current.version + 1
      }
    });
  } else {
    // 首次创建内容
    await prisma.manuscript_chapter_content.create({
      data: {
        chapterId,
        content: newContent,
        version: 1
      }
    });
  }
}
```

#### 版本回滚

```typescript
async rollbackToVersion(chapterId, targetVersion) {
  // 1. 获取目标版本的内容
  const content = await prisma.manuscript_chapter_content.findUnique({
    where: { chapterId }
  });

  const targetContent = await prisma.manuscript_chapter_content_version.findUnique({
    where: {
      contentId_version: {
        contentId: content.id,
        version: targetVersion
      }
    }
  });

  // 2. 恢复内容
  await saveContent(chapterId, targetContent.content);
}
```

---

## 🎯 业务状态枚举

### ManuscriptStatus (文稿状态)

```typescript
enum ManuscriptStatus {
  DRAFT       // 草稿 - 构思中
  IN_PROGRESS // 进行中 - 正在创作
  COMPLETED   // 已完结 - 创作完成
  PUBLISHED   // 已发布 - 发布到平台
  ABANDONED   // 已放弃 - 软删除 (建议改用 deletedAt)
}
```

**建议**: `ABANDONED` 状态可以用 `deletedAt` 字段替代,更灵活。

---

## 📝 完整的创建文稿流程示例

```typescript
// 从大纲创建文稿
async function createManuscriptFromOutline(userId, outlineId) {
  // 1. 获取大纲信息
  const outline = await prisma.outline.findUnique({
    where: { id: outlineId },
    include: {
      volumes: {
        include: { chapters: true },
        orderBy: { sortOrder: 'asc' },
      },
      chapters: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // 2. 创建文稿
  const manuscript = await prisma.manuscripts.create({
    data: {
      name: outline.name,
      description: `根据大纲《${outline.name}》创建`,
      type: outline.type,
      tags: outline.tags,
      outlineId: outline.id, // 记录来源
      userId,
      // 复制设定关联
      characters: outline.characters,
      systems: outline.systems,
      worlds: outline.worlds,
      misc: outline.misc,
    },
  });

  // 3. 复制卷结构
  for (const outlineVolume of outline.volumes) {
    const volume = await prisma.manuscript_volume.create({
      data: {
        manuscriptId: manuscript.id,
        title: outlineVolume.title,
        description: outlineVolume.description,
        sortOrder: outlineVolume.sortOrder,
      },
    });

    // 4. 复制卷内章节
    for (const outlineChapter of outlineVolume.chapters) {
      await prisma.manuscript_chapter.create({
        data: {
          volumeId: volume.id,
          title: outlineChapter.title,
          sortOrder: outlineChapter.sortOrder,
        },
      });
    }
  }

  // 5. 复制无卷章节
  for (const outlineChapter of outline.chapters) {
    await prisma.manuscript_chapter.create({
      data: {
        manuscriptId: manuscript.id,
        title: outlineChapter.title,
        sortOrder: outlineChapter.sortOrder,
      },
    });
  }

  return manuscript;
}
```

---

## ⚠️ 注意事项

1. **字数字段维护**: 必须在 Service 层自动计算和更新,不能依赖前端
2. **设定关联优先级**: 明确 `projectId` 优先于四个数组字段
3. **软删除**: 所有查询都要过滤 `deletedAt`
4. **排序重置**: 定期执行 `reorderVolumes` 和 `reorderChapters`
5. **版本历史**: 控制保留版本数量,避免表过大
6. **事务处理**: 涉及多表更新的操作(如删除卷)要使用事务

---

## 📊 索引说明

已创建的索引:

- `manuscripts`: `[userId, status]`, `[userId, deletedAt]`, `createdAt`, `updatedAt`, `totalWords`, `lastEditedAt`
- `manuscript_volume`: `[manuscriptId, sortOrder]`
- `manuscript_chapter`: `[manuscriptId, sortOrder]`, `[volumeId, sortOrder]`, `status`, `publishedAt`
- `manuscript_chapter_content_version`: `[contentId, version]`

这些索引覆盖了常见查询场景,性能应该足够好。
