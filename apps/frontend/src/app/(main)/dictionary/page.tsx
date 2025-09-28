'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowRight, Database, Tags, Book, Terminal, FileText } from 'lucide-react';
import Link from 'next/link';
import { useDictStore } from '@/stores/dictStore';

// 字典分类配置
const dictionaryCategories = [
  {
    key: 'novel-types',
    title: '小说类型',
    description: '管理小说的类型分类，如玄幻、都市、历史、科幻等',
    icon: Book,
    color: 'text-blue-500',
    apiType: 'novel_types',
  },
  {
    key: 'novel-tags',
    title: '小说标签',
    description: '管理小说标签库，按题材、风格、情节、角色等维度分类',
    icon: Tags,
    color: 'text-green-500',
    apiType: 'novel_tags',
  },
  {
    key: 'terminology',
    title: '专业术语',
    description: '管理各行业专业词汇、技术名词、古风用语等',
    icon: Terminal,
    color: 'text-purple-500',
    apiType: 'terminology',
  },
  {
    key: 'templates',
    title: '模板库',
    description: '管理常用的剧情桥段、对话模板、场景描述等',
    icon: FileText,
    color: 'text-orange-500',
    apiType: 'templates',
  },
];

export default function DictionaryPage() {
  const { fetchStatistics } = useDictStore();
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // 获取字典统计数据
  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        console.log('正在获取字典统计数据...');
        const statistics = await fetchStatistics();
        console.log('获取到统计数据:', statistics);

        // 将API类型映射到页面key
        const mappedCounts: Record<string, number> = {};
        dictionaryCategories.forEach((category) => {
          mappedCounts[category.key] = statistics[category.apiType] || 0;
        });

        console.log('映射后的统计数据:', mappedCounts);
        setCategoryCounts(mappedCounts);
      } catch (error) {
        console.error('获取字典统计数据失败:', error);
        // 失败时设置默认值
        const defaultCounts: Record<string, number> = {};
        dictionaryCategories.forEach((category) => {
          defaultCounts[category.key] = 0;
        });
        setCategoryCounts(defaultCounts);
      } finally {
        setLoading(false);
      }
    };

    void fetchCounts();
  }, [fetchStatistics]);

  // 计算总数
  const totalCategories = dictionaryCategories.length;
  const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="mx-auto max-w-6xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Database className="h-8 w-8 text-[var(--moge-primary)]" />
          <div>
            <h1 className="font-han text-3xl font-bold text-[var(--moge-text-main)]">字典管理</h1>
            <p className="mt-2 text-[var(--moge-text-sub)]">
              管理全局数据字典和基础配置，为创作提供标准化数据支撑
            </p>
          </div>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          className="p-4"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--moge-text-muted)]">分类总数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {loading ? '-' : totalCategories}
              </p>
            </div>
            <Database className="h-8 w-8 text-[var(--moge-primary)]" />
          </div>
        </Card>
        <Card
          className="p-4"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--moge-text-muted)]">词条总数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {loading ? '-' : totalItems.toLocaleString()}
              </p>
            </div>
            <Tags className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card
          className="p-4"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--moge-text-muted)]">启用词条</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {loading ? '-' : totalItems > 0 ? totalItems.toLocaleString() : '0'}
              </p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 分类卡片 */}
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
                          {loading ? '加载中...' : `${count} 个词条`}
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
  );
}
