'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowRight, Database, Tags, Book, Terminal, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { useDictStore } from '@/stores/dictStore';
import { useTranslations } from 'next-intl';

/**
 * 字典分类配置
 * 定义了字典管理模块支持的分类及其展示信息
 */
const getDictionaryCategories = (t: ReturnType<typeof useTranslations>) => [
  {
    key: 'novel_types',
    title: t('categories.novelTypes.title'),
    description: t('categories.novelTypes.description'),
    icon: Book,
    color: 'text-blue-500',
  },
  {
    key: 'novel_eras',
    title: t('categories.novelEras.title'),
    description: t('categories.novelEras.description'),
    icon: Clock,
    color: 'text-yellow-500',
  },
  {
    key: 'novel_tags',
    title: t('categories.novelTags.title'),
    description: t('categories.novelTags.description'),
    icon: Tags,
    color: 'text-green-500',
  },
  {
    key: 'terminology',
    title: t('categories.terminology.title'),
    description: t('categories.terminology.description'),
    icon: Terminal,
    color: 'text-purple-500',
  },
  {
    key: 'templates',
    title: t('categories.templates.title'),
    description: t('categories.templates.description'),
    icon: FileText,
    color: 'text-orange-500',
  },
];

/**
 * 字典管理首页组件
 *
 * 功能：
 * - 展示字典分类概览（分类总数、词条总数、启用词条数）
 * - 展示各分类的卡片列表，可点击进入详情页
 * - 实时获取各分类的词条统计数据
 */
export default function DictionaryPage() {
  const t = useTranslations('dictionary');
  const { fetchStatistics } = useDictStore();
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const dictionaryCategories = getDictionaryCategories(t);

  /**
   * 获取字典统计数据
   * 从后端获取各分类的词条数量并映射到本地状态
   */
  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const statistics = await fetchStatistics();

        const mappedCounts: Record<string, number> = {};
        dictionaryCategories.forEach((category) => {
          mappedCounts[category.key] = statistics[category.key] || 0;
        });

        setCategoryCounts(mappedCounts);
      } catch (error) {
        console.error('获取字典统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchCounts();
  }, [fetchStatistics, dictionaryCategories]);

  // 计算统计数据
  const totalCategories = dictionaryCategories.length;
  const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-6xl flex-shrink-0">
        {/* 页面标题区 */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Database className="h-8 w-8 text-[var(--moge-primary)]" />
            <div>
              <h1 className="font-han text-3xl font-bold text-[var(--moge-text-main)]">
                {t('title')}
              </h1>
              <p className="mt-2 text-[var(--moge-text-sub)]">{t('description')}</p>
            </div>
          </div>
        </div>

        {/* 统计概览卡片 */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 分类总数 */}
          <Card
            className="p-4"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--moge-text-muted)]">
                  {t('stats.totalCategories')}
                </p>
                <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                  {loading ? '-' : totalCategories}
                </p>
              </div>
              <Database className="h-8 w-8 text-[var(--moge-primary)]" />
            </div>
          </Card>

          {/* 词条总数 */}
          <Card
            className="p-4"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--moge-text-muted)]">{t('stats.totalItems')}</p>
                <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                  {loading ? '-' : totalItems.toLocaleString()}
                </p>
              </div>
              <Tags className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          {/* 启用词条数 */}
          <Card
            className="p-4"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--moge-text-muted)]">{t('stats.enabledItems')}</p>
                <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                  {loading ? '-' : totalItems > 0 ? totalItems.toLocaleString() : '0'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* 分类卡片列表 - 可滚动区域 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-1">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {dictionaryCategories.map((category) => {
              const Icon = category.icon;
              const count = categoryCounts[category.key] || 0;

              return (
                <Link key={category.key} href={`/dictionary/${category.key}`}>
                  <Card
                    className="cursor-pointer border p-6 transition-all duration-200 hover:shadow-[var(--moge-glow-card)]"
                    style={{
                      backgroundColor: 'var(--moge-card-bg)',
                      borderColor: 'var(--moge-card-border)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <Icon className={`h-6 w-6 ${category.color}`} />
                          <h3 className="font-semibold text-[var(--moge-text-main)]">
                            {category.title}
                          </h3>
                        </div>
                        <p className="mb-4 text-sm leading-relaxed text-[var(--moge-text-sub)]">
                          {category.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-[var(--moge-text-muted)]">
                              {loading ? t('loading') : `${count} ${t('itemCount')}`}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[var(--moge-text-muted)]" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
