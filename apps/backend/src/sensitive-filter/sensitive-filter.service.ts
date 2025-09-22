// sensitive-filter.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import Mint from 'mint-filter';

interface FilterValue {
  text?: string | boolean;
  filter: Array<string>;
  pass?: boolean;
}

@Injectable()
export class SensitiveFilterService implements OnModuleInit {
  private filter: Mint;

  onModuleInit() {
    // 默认词库
    const defaultWords = ['暴力', '血腥', '色情', 'fuck', '操'];
    this.filter = new Mint(defaultWords);
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
}
