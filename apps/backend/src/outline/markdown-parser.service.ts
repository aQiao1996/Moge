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

interface MarkdownNode {
  type: string;
  depth?: number;
  children?: MarkdownNode[];
  value?: string;
  parent?: MarkdownNode;
}

interface VisitorFunction {
  (node: MarkdownNode, ancestors: MarkdownNode[]): void;
}

@Injectable()
export class MarkdownParserService {
  private readonly logger = new Logger(MarkdownParserService.name);

  // 数字匹配模式：支持全角/半角数字和中文数字
  private readonly NUMBER_PATTERN = '[０-９0-9一二三四五六七八九十百千万１-９1-9]+';

  // 常用正则模式
  private readonly VOLUME_PATTERN = new RegExp(`^第${this.NUMBER_PATTERN}卷\\s*(.+?)(?:<.*>)?$`);
  private readonly CHAPTER_PATTERN = new RegExp(`^第${this.NUMBER_PATTERN}章\\s*(.+?)(?:<.*>)?$`);
  private readonly SCENE_PATTERN = new RegExp(`^场景${this.NUMBER_PATTERN}(.*)$`);
  private readonly SCENE_STRONG_PATTERN = new RegExp(`^场景${this.NUMBER_PATTERN}$`);
  private readonly SCENE_REPLACE_PATTERN = new RegExp(`^\\*\\*场景${this.NUMBER_PATTERN}\\*\\*：?`);

  /**
   * 解析AI生成的Markdown大纲，提取结构化数据
   */
  async parseOutlineMarkdown(markdown: string): Promise<ParsedOutlineStructure> {
    const result: ParsedOutlineStructure = {
      volumes: [],
      directChapters: [],
    };

    try {
      // 动态导入 ESM 模块
      const { unified } = await import('unified');
      const remarkParse = await import('remark-parse');

      const processor = unified().use(remarkParse.default);
      const ast = processor.parse(markdown) as MarkdownNode;

      this.walkAST(ast, result);

      this.logger.debug(
        `解析完成: ${result.volumes.length}卷, ${result.directChapters.length}直接章节`
      );
      return result;
    } catch (error) {
      this.logger.error('解析Markdown大纲失败', error);
      return { volumes: [], directChapters: [] };
    }
  }

  /**
   * 遍历 AST 并提取结构化数据
   */
  private walkAST(ast: MarkdownNode, result: ParsedOutlineStructure): void {
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

    this.visit(ast, (node) => {
      // 处理标题节点
      if (node.type === 'heading' && node.depth) {
        const headingText = this.extractTextFromNode(node);

        if (node.depth === 3) {
          // ### 第X卷 - 卷标题
          const volumeMatch = headingText.match(this.VOLUME_PATTERN);

          if (volumeMatch) {
            // 保存上一个卷
            this.saveCurrentChapter(currentChapter, currentVolume, result);
            this.saveCurrentVolume(currentVolume, result);

            const title = headingText.replace(/<.*>.*$/, '').trim();
            this.logger.debug(`解析到卷: "${title}"`);

            currentVolume = {
              title,
              description: this.extractDescription(volumeMatch[1]),
              chapters: [],
            };
            currentChapter = null;
          }
        } else if (node.depth === 4) {
          // #### 第X章 - 章标题
          const chapterMatch = headingText.match(this.CHAPTER_PATTERN);

          if (chapterMatch) {
            // 保存上一章
            this.saveCurrentChapter(currentChapter, currentVolume, result);

            const title = headingText.replace(/<.*>.*$/, '').trim();
            this.logger.debug(`解析到章: "${title}"`);

            currentChapter = {
              title,
              scenes: [],
            };
          }
        } else if (node.depth === 5) {
          // ##### 场景X - 场景标题
          const sceneMatch = headingText.match(this.SCENE_PATTERN);

          if (sceneMatch && currentChapter) {
            const sceneContent = sceneMatch[1].trim();
            if (sceneContent) {
              currentChapter.scenes.push(sceneContent);
            }
          }
        }
      }

      // 处理列表项中的场景
      if (node.type === 'listItem') {
        this.extractScenesFromListItem(node, currentChapter);
      }
    });

    // 保存最后的章节和卷
    this.saveCurrentChapter(currentChapter, currentVolume, result);
    this.saveCurrentVolume(currentVolume, result);
  }

  /**
   * 简单的 AST 遍历实现
   */
  private visit(
    node: MarkdownNode,
    visitor: VisitorFunction,
    ancestors: MarkdownNode[] = []
  ): void {
    visitor(node, ancestors);

    if (node.children) {
      const newAncestors = [...ancestors, node];
      for (const child of node.children) {
        child.parent = node; // 设置父节点引用
        this.visit(child, visitor, newAncestors);
      }
    }
  }

  /**
   * 从列表项中提取场景信息
   */
  private extractScenesFromListItem(
    listItem: MarkdownNode,
    currentChapter: { scenes: string[] } | null
  ): void {
    if (!currentChapter) return;

    this.visit(listItem, (node) => {
      if (node.type === 'strong') {
        const strongText = this.extractTextFromNode(node);

        // 匹配 **场景X**：
        const sceneMatch = strongText.match(this.SCENE_STRONG_PATTERN);
        if (sceneMatch) {
          // 寻找场景描述
          const parent = node.parent;
          if (parent && parent.type === 'paragraph') {
            const paragraphText = this.extractTextFromNode(parent);
            const sceneDescription = paragraphText.replace(this.SCENE_REPLACE_PATTERN, '').trim();

            if (sceneDescription) {
              currentChapter.scenes.push(`${strongText}：${sceneDescription}`);
            }
          }
        }
      }
    });
  }

  /**
   * 从节点中提取纯文本
   */
  private extractTextFromNode(node: MarkdownNode): string {
    let text = '';

    this.visit(node, (child) => {
      if (child.type === 'text' && child.value) {
        text += child.value;
      }
    });

    return text.trim();
  }

  /**
   * 保存当前章节
   */
  private saveCurrentChapter(
    currentChapter: { title: string; scenes: string[] } | null,
    currentVolume: { chapters: Array<{ title: string; scenes: string[] }> } | null,
    result: ParsedOutlineStructure
  ): void {
    if (currentChapter) {
      if (currentVolume) {
        currentVolume.chapters.push(currentChapter);
      } else {
        result.directChapters.push(currentChapter);
      }
    }
  }

  /**
   * 保存当前卷
   */
  private saveCurrentVolume(
    currentVolume: {
      title: string;
      description?: string;
      chapters: Array<{ title: string; scenes: string[] }>;
    } | null,
    result: ParsedOutlineStructure
  ): void {
    if (currentVolume) {
      result.volumes.push(currentVolume);
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
