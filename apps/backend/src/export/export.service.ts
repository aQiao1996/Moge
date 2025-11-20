import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManuscriptsService } from '../manuscripts/manuscripts.service';

export interface ExportOptions {
  format: 'txt' | 'markdown';
  includeMetadata?: boolean;
  preserveFormatting?: boolean;
}

/**
 * 导出服务
 * 提供文稿的导出功能
 */
@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private manuscriptsService: ManuscriptsService
  ) {}

  /**
   * 导出单个章节为TXT
   */
  async exportChapterToTxt(chapterId: number, userId: number): Promise<string> {
    const chapter = await this.prisma.manuscript_chapter.findFirst({
      where: {
        id: chapterId,
        manuscript: {
          userId,
        },
      },
      include: {
        content: true,
        manuscript: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new Error('章节不存在或无权访问');
    }

    // 构建导出内容
    let output = '';

    // 添加标题
    output += `${chapter.manuscript.name}\n`;
    output += '='.repeat(chapter.manuscript.name.length) + '\n\n';
    output += `${chapter.title}\n`;
    output += '-'.repeat(chapter.title.length) + '\n\n';

    // 添加内容，移除Markdown格式标记
    if (chapter.content?.content) {
      const cleanContent = this.cleanMarkdown(chapter.content.content);
      output += cleanContent + '\n';
    }

    // 添加字数统计
    output += '\n' + '-'.repeat(20) + '\n';
    output += `字数：${chapter.wordCount || 0} 字\n`;

    return output;
  }

  /**
   * 导出整个文稿为TXT
   */
  async exportManuscriptToTxt(
    manuscriptId: number,
    userId: number,
    options?: ExportOptions
  ): Promise<string> {
    const manuscript = await this.prisma.manuscripts.findFirst({
      where: {
        id: manuscriptId,
        userId,
      },
    });

    if (!manuscript) {
      throw new Error('文稿不存在或无权访问');
    }

    // 获取所有章节
    const chapters = await this.prisma.manuscript_chapter.findMany({
      where: {
        OR: [
          { manuscriptId: manuscriptId },
          {
            volume: {
              manuscriptId: manuscriptId,
            },
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        content: true,
        volume: true,
      },
    });

    // 获取大纲信息
    const outline = manuscript.outlineId
      ? await this.prisma.outline.findUnique({
          where: { id: manuscript.outlineId },
          select: {
            name: true,
          },
        })
      : null;

    // 构建导出内容
    let output = '';

    // 添加文稿标题和元信息
    output += `${manuscript.name}\n`;
    output += '='.repeat(manuscript.name.length * 2) + '\n\n';

    if (options?.includeMetadata) {
      output += '【作品信息】\n';
      output += `创建时间：${this.formatDate(manuscript.createdAt)}\n`;
      output += `最后编辑：${this.formatDate(manuscript.lastEditedAt || manuscript.updatedAt)}\n`;
      output += `总字数：${manuscript.totalWords || 0} 字\n`;
      output += `章节数：${chapters.length} 章\n`;
      if (outline) {
        output += `大纲：${outline.name}\n`;
      }
      output += '\n' + '='.repeat(40) + '\n\n';
    }

    // 按卷分组章节
    const volumeMap = new Map<number | null, typeof chapters>();
    const noVolumeChapters: typeof chapters = [];

    chapters.forEach((chapter) => {
      if (chapter.volumeId) {
        if (!volumeMap.has(chapter.volumeId)) {
          volumeMap.set(chapter.volumeId, []);
        }
        volumeMap.get(chapter.volumeId)?.push(chapter);
      } else {
        noVolumeChapters.push(chapter);
      }
    });

    // 导出无卷章节（如序章）
    if (noVolumeChapters.length > 0) {
      for (const chapter of noVolumeChapters) {
        output += `${chapter.title}\n`;
        output += '-'.repeat(20) + '\n\n';

        if (chapter.content?.content) {
          const cleanContent = options?.preserveFormatting
            ? chapter.content.content
            : this.cleanMarkdown(chapter.content.content);
          output += cleanContent + '\n\n';
        } else {
          output += '（本章暂无内容）\n\n';
        }
      }
    }

    // 导出各卷章节
    let volumeIndex = 1;
    for (const [volumeId, volumeChapters] of volumeMap) {
      if (volumeId && volumeChapters.length > 0) {
        const volumeInfo = volumeChapters[0].volume;
        if (volumeInfo) {
          output += `\n第${this.numberToChinese(volumeIndex)}卷 ${volumeInfo.title}\n`;
          output += '='.repeat(20) + '\n\n';
          volumeIndex++;
        }

        let chapterIndex = 1;
        for (const chapter of volumeChapters) {
          // 章节标题
          output += `第${this.numberToChinese(chapterIndex)}章 ${chapter.title}\n`;
          output += '-'.repeat(20) + '\n\n';
          chapterIndex++;

          // 章节内容
          if (chapter.content?.content) {
            const cleanContent = options?.preserveFormatting
              ? chapter.content.content
              : this.cleanMarkdown(chapter.content.content);
            output += cleanContent + '\n\n';
          } else {
            output += '（本章暂无内容）\n\n';
          }
        }
      }
    }

    // 添加结尾统计
    output += '\n' + '='.repeat(40) + '\n';
    output += `【全书完】\n`;
    output += `总字数：${manuscript.totalWords || 0} 字\n`;
    output += `导出时间：${this.formatDate(new Date())}\n`;

    return output;
  }

  /**
   * 批量导出多个章节
   */
  async exportChaptersBatch(
    chapterIds: number[],
    userId: number
  ): Promise<{ [chapterId: number]: string }> {
    const results: { [chapterId: number]: string } = {};

    for (const chapterId of chapterIds) {
      try {
        const content = await this.exportChapterToTxt(chapterId, userId);
        results[chapterId] = content;
      } catch (error) {
        console.error(`导出章节 ${chapterId} 失败:`, error);
      }
    }

    return results;
  }

  /**
   * 导出为Markdown格式
   */
  async exportManuscriptToMarkdown(manuscriptId: number, userId: number): Promise<string> {
    const manuscript = await this.prisma.manuscripts.findFirst({
      where: {
        id: manuscriptId,
        userId,
      },
    });

    if (!manuscript) {
      throw new Error('文稿不存在或无权访问');
    }

    // 获取所有章节
    const chapters = await this.prisma.manuscript_chapter.findMany({
      where: {
        OR: [
          { manuscriptId: manuscriptId },
          {
            volume: {
              manuscriptId: manuscriptId,
            },
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        content: true,
        volume: true,
      },
    });

    let output = '';

    // 添加文稿标题
    output += `# ${manuscript.name}\n\n`;

    // 添加目录
    output += '## 目录\n\n';
    let chapterNum = 1;
    chapters.forEach((chapter) => {
      const chapterTitle = chapter.volumeId
        ? `第${this.numberToChinese(chapterNum++)}章 ${chapter.title}`
        : chapter.title;
      const anchorId = chapterTitle.replace(/\s/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
      output += `- [${chapterTitle}](#${anchorId})\n`;
    });
    output += '\n---\n\n';

    // 添加章节内容
    chapterNum = 1;
    for (const chapter of chapters) {
      const chapterTitle = chapter.volumeId
        ? `第${this.numberToChinese(chapterNum++)}章 ${chapter.title}`
        : chapter.title;
      output += `## ${chapterTitle}\n\n`;
      if (chapter.content?.content) {
        output += chapter.content.content + '\n\n';
      } else {
        output += '> 本章暂无内容\n\n';
      }
      output += '---\n\n';
    }

    return output;
  }

  /**
   * 清理Markdown格式标记
   */
  private cleanMarkdown(content: string): string {
    return content
      .replace(/#{1,6}\s/g, '') // 移除标题标记
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体
      .replace(/\*([^*]+)\*/g, '$1') // 移除斜体
      .replace(/`([^`]+)`/g, '$1') // 移除行内代码
      .replace(/```[^`]*```/g, '') // 移除代码块
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片
      .replace(/^[-*+]\s/gm, '') // 移除列表标记
      .replace(/^\d+\.\s/gm, '') // 移除有序列表标记
      .replace(/^>\s/gm, '') // 移除引用标记
      .replace(/\n{3,}/g, '\n\n'); // 限制最多两个连续换行
  }

  /**
   * 数字转中文
   */
  private numberToChinese(num: number): string {
    const chinese = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (num <= 10) {
      return chinese[num];
    } else if (num < 20) {
      return '十' + (num - 10 > 0 ? chinese[num - 10] : '');
    } else if (num < 100) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      return chinese[tens] + '十' + (ones > 0 ? chinese[ones] : '');
    }
    return num.toString();
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date | null): string {
    if (!date) return '未知';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
