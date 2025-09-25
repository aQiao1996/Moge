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
  level?: 'strict' | 'moderate' | 'creative';
}

export enum FilterLevel {
  STRICT = 'strict', // 最严格：所有敏感词
  MODERATE = 'moderate', // 中等：排除创作常用词
  CREATIVE = 'creative', // 创作模式：仅限违法违规内容
}

@Injectable()
export class SensitiveFilterService implements OnModuleInit {
  private strictFilter: Mint; // 严格模式过滤器
  private moderateFilter: Mint; // 中等模式过滤器
  private creativeFilter: Mint; // 创作模式过滤器

  // 常用汉字白名单：这些单字在正常语境中应该被允许
  private readonly commonCharsWhitelist = [
    // 常用单字
    '藏',
    '真',
    '相',
    '法',
    '理',
    '道',
    '德',
    '义',
    '正',
    '善',
    '美',
    '爱',
    '和',
    '平',
    '自',
    '由',
    '民',
    '主',
    '国',
    '家',
    '人',
    '民',
    '社',
    '会',
    '发',
    '展',
    '建',
    '设',
    '改',
    '革',
    '开',
    '放',
    '科',
    '学',
    '技',
    '术',
    '文',
    '化',
    '教',
    '育',
    '历',
    '史',
    '传',
    '统',
    '现',
    '代',
    '未',
    '来',
    '世',
    '界',
    // 地名相关
    '京',
    '沪',
    '粤',
    '川',
    '苏',
    '浙',
    '鲁',
    '豫',
    '陕',
    '晋',
    '冀',
    '辽',
    '吉',
    '黑',
    '皖',
    '闽',
    '赣',
    '湘',
    '鄂',
    '桂',
    '琼',
    '渝',
    '蜀',
    '滇',
    '黔',
    '甘',
    '青',
    '宁',
    '新',
    '港',
    '澳',
    '台',
  ];

  // 创作类应用可以使用的词汇（从严格列表中排除）
  private readonly creativeAllowedWords = [
    '杀',
    '死',
    '血',
    '暴力',
    '战争',
    '斗争',
    '复仇',
    '刺杀',
    '谋杀',
    '屠杀',
    '剑',
    '刀',
    '枪',
    '武器',
    '兵器',
    '战斗',
    '决斗',
    '搏斗',
    '恶魔',
    '魔鬼',
    '地狱',
    '黑暗',
    '邪恶',
    '诅咒',
    '恶灵',
    '帝王',
    '皇帝',
    '国王',
    '君主',
    '统治',
    '征服',
    '霸权',
    '革命',
    '起义',
    '反抗',
    '推翻',
    '政变',
    '造反',
    // 历史人物名字也应该允许在创作中使用
    '希特勒',
    '拿破仑',
    '亚历山大',
    '凯撒',
    // 常见词汇
    '真相',
    '真理',
    '真实',
    '藏书',
    '收藏',
    '宝藏',
    '隐藏',
    '西藏',
  ];

  // 绝对不允许的内容（违法违规）
  private readonly absoluteForbidden = [
    // 政治敏感
    '毛泽东',
    '周恩来',
    '邓小平',
    '蒋介石',
    '孙中山',
    '习近平',
    '李克强',
    '习主席',
    '胡主席',
    '下台',
    '政变',
    '颠覆政权',
    // 分裂国家
    '港独',
    '台独',
    '藏独',
    '疆独',
    '分裂国家',
    '独立运动',
    // 违法犯罪
    '毒品',
    '吸毒',
    '贩毒',
    '制毒',
    '冰毒',
    '海洛因',
    '大麻',
    '炸弹',
    '爆炸',
    '恐怖袭击',
    '自杀炸弹',
    // 色情内容
    '色情',
    '淫秽',
    '黄色网站',
    '成人网站',
    // 赌博
    '赌博',
    '博彩',
    '赌场',
    '老虎机',
    '六合彩',
  ];

  async onModuleInit() {
    // 初始化三个不同级别的过滤器
    this.strictFilter = new Mint([]);
    this.moderateFilter = new Mint([]);
    this.creativeFilter = new Mint([]);

    const wordsPath = path.join(__dirname, '../public/Tencent-offline-sensitive-words.json');

    try {
      const jsonContent = readFileSync(wordsPath, 'utf8');
      const words = JSON.parse(jsonContent) as string[];

      console.log(`🚀 ~ 开始加载 ${words.length} 个敏感词...`);

      // 分批加载到不同的过滤器
      const batchSize = 1000;
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);

        for (const word of batch) {
          if (word && word.trim()) {
            const trimmedWord = word.trim();

            // 严格模式：加载所有词
            this.strictFilter.insert(trimmedWord);

            // 中等模式：排除部分创作用词
            if (
              !this.creativeAllowedWords.some(
                (allowed) => trimmedWord.includes(allowed) || allowed.includes(trimmedWord)
              )
            ) {
              this.moderateFilter.insert(trimmedWord);
            }

            // 创作模式：只加载绝对禁止的词
            if (
              this.absoluteForbidden.some(
                (forbidden) => trimmedWord.includes(forbidden) || forbidden.includes(trimmedWord)
              )
            ) {
              this.creativeFilter.insert(trimmedWord);
            }
          }
        }

        // 每处理一批后让出控制权
        if (i + batchSize < words.length) {
          await new Promise((resolve) => setImmediate(resolve));
        }
      }

      console.log('🚀 ~ 敏感词加载完成');
      console.log(
        `📊 ~ 严格模式: ${words.length} 词, 中等模式: ~${Math.floor(words.length * 0.7)} 词, 创作模式: ~${this.absoluteForbidden.length * 10} 词`
      );
    } catch (error) {
      console.error('🚀 ~ 加载敏感词文件失败:', error);
    }
  }

  private getFilterByLevel(level: FilterLevel): Mint {
    switch (level) {
      case FilterLevel.STRICT:
        return this.strictFilter;
      case FilterLevel.MODERATE:
        return this.moderateFilter;
      case FilterLevel.CREATIVE:
        return this.creativeFilter;
      default:
        return this.moderateFilter;
    }
  }

  /** 同步检测：只要命中一个就返回 true */
  check(text: string, level: FilterLevel = FilterLevel.MODERATE): boolean {
    const filter = this.getFilterByLevel(level);
    return !filter.everySync(text);
  }

  /** 同步替换 */
  replace(text: string, level: FilterLevel = FilterLevel.MODERATE): FilterValue {
    const filter = this.getFilterByLevel(level);
    return filter.filterSync(text);
  }

  /** 异步检测（大文本时不会阻塞事件循环） */
  async checkAsync(text: string, level: FilterLevel = FilterLevel.MODERATE): Promise<boolean> {
    const filter = this.getFilterByLevel(level);
    const res = await filter.every(text);
    return !res;
  }

  /**
   * 智能过滤敏感词：对单字和常用词汇进行白名单检查
   * @param words 需要过滤的词汇数组
   * @param level 过滤级别
   * @returns 过滤后的敏感词数组
   */
  private smartFilterSensitiveWords(words: string[], level: FilterLevel): string[] {
    return words.filter((word) => {
      // 如果是创作模式，检查是否在常用字白名单中
      if (level === FilterLevel.CREATIVE || level === FilterLevel.MODERATE) {
        // 单字白名单检查
        if (word.length === 1 && this.commonCharsWhitelist.includes(word)) {
          return false; // 在白名单中，不认为是敏感词
        }

        // 常用词汇白名单检查
        if (this.creativeAllowedWords.includes(word)) {
          return false;
        }
      }

      // 检查是否包含绝对禁止的内容
      const containsAbsoluteForbidden = this.absoluteForbidden.some(
        (forbidden) => word.includes(forbidden) || forbidden.includes(word)
      );

      // 如果是创作模式，只有包含绝对禁止内容的才算敏感词
      if (level === FilterLevel.CREATIVE) {
        return containsAbsoluteForbidden;
      }

      // 其他模式保持原有逻辑
      return true;
    });
  }

  /** 详细检测：返回具体的违规词汇（带智能过滤） */
  checkDetailed(text: string, level: FilterLevel = FilterLevel.MODERATE): SensitiveCheckResult {
    const filter = this.getFilterByLevel(level);
    const filterResult = filter.filterSync(text);

    // 对检测到的敏感词进行智能过滤
    const rawSensitiveWords = filterResult.filter || [];
    const smartFilteredWords = this.smartFilterSensitiveWords(rawSensitiveWords, level);

    return {
      hasSensitive: smartFilteredWords.length > 0,
      sensitiveWords: smartFilteredWords,
      filteredText: typeof filterResult.text === 'string' ? filterResult.text : undefined,
      level,
    };
  }

  /** 异步详细检测：返回具体的违规词汇（带智能过滤） */
  async checkDetailedAsync(
    text: string,
    level: FilterLevel = FilterLevel.MODERATE
  ): Promise<SensitiveCheckResult> {
    const filter = this.getFilterByLevel(level);
    const filterResult = await filter.filter(text);

    // 对检测到的敏感词进行智能过滤
    const rawSensitiveWords = filterResult.filter || [];
    const smartFilteredWords = this.smartFilterSensitiveWords(rawSensitiveWords, level);

    return {
      hasSensitive: smartFilteredWords.length > 0,
      sensitiveWords: smartFilteredWords,
      filteredText: typeof filterResult.text === 'string' ? filterResult.text : undefined,
      level,
    };
  }
}
