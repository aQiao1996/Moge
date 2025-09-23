import { Injectable, Logger } from '@nestjs/common';

export interface ParsedOutlineStructure {
  volumes: Array<{
    title: string;
    description?: string;
    chapters: Array<{
      title: string;
      scenes: string[];
    }>;
  }>;
  directChapters: Array<{
    title: string;
    scenes: string[];
  }>;
}

@Injectable()
export class MarkdownParserService {
  private readonly logger = new Logger(MarkdownParserService.name);

  /**
   * 解析AI生成的Markdown大纲，提取结构化数据
   */
  parseOutlineMarkdown(markdown: string): ParsedOutlineStructure {
    const result: ParsedOutlineStructure = {
      volumes: [],
      directChapters: [],
    };

    try {
      // 按行分割，过滤空行
      const lines = markdown.split('\n').filter((line) => line.trim());

      let currentVolume: {
        title: string;
        description?: string;
        chapters: Array<{
          title: string;
          scenes: string[];
        }>;
      } | null = null;
      let currentChapter: {
        title: string;
        scenes: string[];
      } | null = null;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // 匹配卷标题：### 第X卷 卷名
        const volumeMatch = trimmedLine.match(
          /^###\s*第[０-９0-9一二三四五六七八九十百千万１-９1-9]+卷\s*(.+?)(?:<.*>)?$/
        );
        if (volumeMatch) {
          // 保存上一个卷
          if (currentVolume) {
            if (currentChapter) {
              currentVolume.chapters.push(currentChapter);
              currentChapter = null;
            }
            result.volumes.push(currentVolume);
          }

          // 创建新卷 - 提取完整的卷标题
          const fullVolumeTitle = trimmedLine
            .replace(/^###\s*/, '')
            .replace(/<.*>.*$/, '')
            .trim();
          this.logger.debug(`解析到卷: "${fullVolumeTitle}"`);
          currentVolume = {
            title: fullVolumeTitle,
            description: this.extractDescription(volumeMatch[1]),
            chapters: [],
          };
          continue;
        }

        // 匹配章标题：#### 第X章 章名
        const chapterMatch = trimmedLine.match(
          /^####\s*第[０-９0-9一二三四五六七八九十百千万１-９1-9]+章\s*(.+?)(?:<.*>)?$/
        );
        if (chapterMatch) {
          // 保存上一章
          if (currentChapter) {
            if (currentVolume) {
              currentVolume.chapters.push(currentChapter);
            } else {
              result.directChapters.push(currentChapter);
            }
          }

          // 创建新章 - 提取完整的章标题
          const fullChapterTitle = trimmedLine
            .replace(/^####\s*/, '')
            .replace(/<.*>.*$/, '')
            .trim();
          this.logger.debug(`解析到章: "${fullChapterTitle}"`);
          currentChapter = {
            title: fullChapterTitle,
            scenes: [],
          };
          continue;
        }

        // 匹配场景：##### 场景X 或 - **场景X**：
        const sceneMatch = trimmedLine.match(
          /^(?:#####\s*场景[０-９0-9一二三四五六七八九十１-９1-9]+|[-*]\s*\*\*场景[０-９0-9一二三四五六七八九十１-９1-9]+\*\*：?)(.*)$/
        );
        if (sceneMatch && currentChapter) {
          const sceneContent = sceneMatch[1].trim();
          if (sceneContent) {
            currentChapter.scenes.push(sceneContent);
          }
          continue;
        }

        // 匹配简单的场景描述行：- **场景X**：描述内容
        const simpleSceneMatch = trimmedLine.match(/^[-*]\s*\*\*(.+?)\*\*：(.+)$/);
        if (simpleSceneMatch && currentChapter) {
          currentChapter.scenes.push(`${simpleSceneMatch[1]}：${simpleSceneMatch[2]}`);
          continue;
        }
      }

      // 处理最后的章节和卷
      if (currentChapter) {
        if (currentVolume) {
          currentVolume.chapters.push(currentChapter);
        } else {
          result.directChapters.push(currentChapter);
        }
      }
      if (currentVolume) {
        result.volumes.push(currentVolume);
      }

      this.logger.debug(
        `解析完成: ${result.volumes.length}卷, ${result.directChapters.length}直接章节`
      );
      return result;
    } catch (error) {
      this.logger.error('解析Markdown大纲失败', error);
      // 返回空结构，避免阻断流程
      return { volumes: [], directChapters: [] };
    }
  }

  /**
   * 从卷名中提取描述信息
   */
  private extractDescription(volumeTitle: string): string | undefined {
    // 如果有特殊标记或描述，可以在这里处理
    return volumeTitle.length > 10 ? volumeTitle : undefined;
  }

  /**
   * 验证解析结果是否合理
   */
  validateParsedStructure(structure: ParsedOutlineStructure): boolean {
    // 至少要有卷或者直接章节
    if (structure.volumes.length === 0 && structure.directChapters.length === 0) {
      return false;
    }

    // 检查卷是否有章节
    for (const volume of structure.volumes) {
      if (!volume.title || volume.chapters.length === 0) {
        return false;
      }
    }

    return true;
  }
}
