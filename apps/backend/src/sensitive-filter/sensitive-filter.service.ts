// sensitive-filter.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import Mint from 'mint-filter';
import { readFileSync } from 'fs';
import * as path from 'path';

interface FilterValue {
  text?: string | boolean;
  filter: Array<string>;
  pass?: boolean;
}

interface SensitiveCheckResult {
  hasSensitive: boolean;
  sensitiveWords: string[];
  filteredText?: string;
}

@Injectable()
export class SensitiveFilterService implements OnModuleInit {
  private filter: Mint;

  async onModuleInit() {
    this.filter = new Mint(['暴力']);

    const wordsPath = path.join(__dirname, '../public/Tencent-offline-sensitive-words.json');

    try {
      const jsonContent = readFileSync(wordsPath, 'utf8');
      const words = JSON.parse(jsonContent) as string[];

      console.log(`🚀 ~ 开始加载 ${words.length} 个敏感词...`);

      // 分批加载，避免阻塞事件循环
      const batchSize = 1000;
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);
        for (const word of batch) {
          if (word && word.trim()) {
            this.filter.insert(word.trim());
          }
        }

        // 每处理一批后让出控制权
        if (i + batchSize < words.length) {
          await new Promise((resolve) => setImmediate(resolve));
        }
      }

      console.log('🚀 ~ 敏感词加载完成');
    } catch (error) {
      console.error('🚀 ~ 加载敏感词文件失败:', error);
    }
  }

  /** 同步检测：只要命中一个就返回 true */
  check(text: string): boolean {
    return !this.filter.everySync(text); // everySync 返回 false 表示有敏感词
  }

  /** 同步替换 */
  replace(text: string): FilterValue {
    return this.filter.filterSync(text);
  }

  /** 异步检测（大文本时不会阻塞事件循环） */
  async checkAsync(text: string): Promise<boolean> {
    const res = await this.filter.every(text);
    return !res;
  }

  /** 详细检测：返回具体的违规词汇 */
  checkDetailed(text: string): SensitiveCheckResult {
    const filterResult = this.filter.filterSync(text);

    return {
      hasSensitive: !filterResult.pass,
      sensitiveWords: filterResult.filter || [],
      filteredText: typeof filterResult.text === 'string' ? filterResult.text : undefined,
    };
  }

  /** 异步详细检测：返回具体的违规词汇 */
  async checkDetailedAsync(text: string): Promise<SensitiveCheckResult> {
    const filterResult = await this.filter.filter(text);

    return {
      hasSensitive: !filterResult.pass,
      sensitiveWords: filterResult.filter || [],
      filteredText: typeof filterResult.text === 'string' ? filterResult.text : undefined,
    };
  }
}
