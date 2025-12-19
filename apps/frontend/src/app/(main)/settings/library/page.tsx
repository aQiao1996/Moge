'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Zap, Globe, Folder, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSettingsLibrary, type SettingsLibraryResponse } from '@/api/settings.api';

export default function SettingsLibraryPage() {
  const t = useTranslations('settings.library');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settingsData, setSettingsData] = useState<SettingsLibraryResponse>({
    characters: [],
    systems: [],
    worlds: [],
    misc: [],
  });

  // 设定分类配置
  const settingCategories = [
    {
      key: 'characters',
      label: t('categories.characters.label'),
      icon: Users,
      description: t('categories.characters.description'),
      color: 'text-blue-500',
    },
    {
      key: 'systems',
      label: t('categories.systems.label'),
      icon: Zap,
      description: t('categories.systems.description'),
      color: 'text-yellow-500',
    },
    {
      key: 'worlds',
      label: t('categories.worlds.label'),
      icon: Globe,
      description: t('categories.worlds.description'),
      color: 'text-green-500',
    },
    {
      key: 'misc',
      label: t('categories.misc.label'),
      icon: Folder,
      description: t('categories.misc.description'),
      color: 'text-purple-500',
    },
  ];

  /**
   * 从API加载设定库数据
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettingsLibrary();
      setSettingsData(data);
    } catch (error) {
      console.error(t('loadFailed'), error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    void loadSettings();
  }, []);

  const handleCategoryClick = (categoryKey: string) => {
    router.push(`/settings/library/${categoryKey}`);
  };

  // 计算各分类的数量
  const getCategoryCount = (key: string) => {
    switch (key) {
      case 'characters':
        return settingsData.characters.length;
      case 'systems':
        return settingsData.systems.length;
      case 'worlds':
        return settingsData.worlds.length;
      case 'misc':
        return settingsData.misc.length;
      default:
        return 0;
    }
  };

  const totalSettings =
    settingsData.characters.length +
    settingsData.systems.length +
    settingsData.worlds.length +
    settingsData.misc.length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* 面包屑导航 */}
      <div className="mb-6 flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t('backToSettings')}
          </Button>
        </Link>
        <span className="text-[var(--moge-text-muted)]">/</span>
        <span className="font-medium text-[var(--moge-text-main)]">{t('title')}</span>
      </div>

      {/* 设定库信息头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">
              {t('title')}
            </h1>
            <p className="mt-1 text-[var(--moge-text-sub)]">{t('description')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--moge-text-sub)]">{t('totalSettings')}</p>
            <p className="text-2xl font-bold text-[var(--moge-text-main)]">{totalSettings}</p>
          </div>
        </div>
      </div>

      {/* 设定分类卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {settingCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.key}
              className="border p-6 transition-all duration-200 hover:shadow-[var(--moge-glow-card)]"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${category.color}`} />
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--moge-text-main)]">
                        {category.label}
                      </h3>
                      <p className="text-sm text-[var(--moge-text-sub)]">{category.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                    {getCategoryCount(category.key)}
                  </p>
                  <p className="text-xs text-[var(--moge-text-muted)]">{t('itemCount')}</p>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  className="w-full"
                  onClick={() => handleCategoryClick(category.key)}
                  disabled={loading}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t('viewAll')}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
