'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Zap, Globe, Folder, Edit } from 'lucide-react';
import { getManuscriptSettings, updateManuscript } from '../api/client';
import SettingSelectorDialog from '@/app/(main)/settings/components/SettingSelectorDialog';
import { toast } from 'sonner';

interface Setting {
  id: number;
  name: string;
  background?: string | null;
  description?: string | null;
  tags?: string[];
}

interface ManuscriptSettingsPanelProps {
  manuscriptId: number;
}

type CategoryKey = 'characters' | 'systems' | 'worlds' | 'misc';

/**
 * 文稿关联设定面板组件
 * 显示文稿关联的角色、系统、世界、辅助设定
 */
export default function ManuscriptSettingsPanel({ manuscriptId }: ManuscriptSettingsPanelProps) {
  const [settings, setSettings] = useState<{
    characters: Setting[];
    systems: Setting[];
    worlds: Setting[];
    misc: Setting[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryKey>('characters');

  // 加载关联设定
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getManuscriptSettings(manuscriptId);
      // 后端返回的是设定对象数组，而 ManuscriptSettings 类型定义为字符串数组
      // 这里使用 unknown 进行中间转换
      setSettings(
        response.data as unknown as {
          characters: Setting[];
          systems: Setting[];
          worlds: Setting[];
          misc: Setting[];
        }
      );
    } catch (error) {
      console.error('加载关联设定失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, [manuscriptId]);

  // 打开设定选择器
  const handleOpenSelector = (category: CategoryKey) => {
    setCurrentCategory(category);
    setSelectorOpen(true);
  };

  // 确认选择设定
  const handleConfirmSelection = async (selectedIds: string[]) => {
    try {
      await updateManuscript(manuscriptId, {
        [currentCategory]: selectedIds,
      });
      toast.success('更新设定成功');
      await loadSettings();
    } catch (error) {
      console.error('更新设定失败:', error);
    }
  };

  // 获取当前选中的设定ID列表
  const getSelectedIds = (category: CategoryKey): string[] => {
    if (!settings) return [];
    return settings[category].map((s) => String(s.id));
  };

  // 分类配置
  const categories = [
    {
      key: 'characters' as CategoryKey,
      label: '角色设定',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      key: 'systems' as CategoryKey,
      label: '系统/金手指',
      icon: Zap,
      color: 'text-yellow-500',
    },
    {
      key: 'worlds' as CategoryKey,
      label: '世界背景',
      icon: Globe,
      color: 'text-green-500',
    },
    {
      key: 'misc' as CategoryKey,
      label: '辅助设定',
      icon: Folder,
      color: 'text-purple-500',
    },
  ];

  // 渲染设定分类卡片
  const renderCategoryCard = (
    key: CategoryKey,
    title: string,
    icon: React.ReactNode,
    iconColor: string,
    items: Setting[]
  ) => {
    return (
      <Card
        className="border p-6 backdrop-blur-xl"
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${iconColor}`}>{icon}</div>
            <h3 className="font-semibold text-[var(--moge-text-main)]">{title}</h3>
            <Badge variant="secondary" className="text-xs">
              {items.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => handleOpenSelector(key)}
          >
            <Edit className="h-3 w-3" />
            编辑
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-sm text-[var(--moge-text-muted)]">暂无{title}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4 transition-colors hover:bg-[var(--moge-input-bg)]"
                style={{ borderColor: 'var(--moge-card-border)' }}
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium text-[var(--moge-text-main)]">{item.name}</h4>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {(item.background || item.description) && (
                  <p className="line-clamp-2 text-sm text-[var(--moge-text-sub)]">
                    {item.background || item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-[var(--moge-input-bg)]" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <Card
        className="border p-10 text-center backdrop-blur-xl"
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
        }}
      >
        <p className="text-[var(--moge-text-sub)]">无法加载关联设定</p>
      </Card>
    );
  }

  const totalSettings =
    settings.characters.length +
    settings.systems.length +
    settings.worlds.length +
    settings.misc.length;

  // 获取当前分类配置
  const currentCategoryConfig = categories.find((c) => c.key === currentCategory);

  return (
    <div className="space-y-6">
      {/* 总览 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--moge-text-main)]">关联设定</h2>
        <Badge variant="secondary">共 {totalSettings} 个设定</Badge>
      </div>

      {totalSettings === 0 ? (
        <Card
          className="border p-10 text-center backdrop-blur-xl"
          style={{
            backgroundColor: 'var(--moge-card-bg)',
            borderColor: 'var(--moge-card-border)',
          }}
        >
          <Folder className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
          <p className="mt-4 text-[var(--moge-text-sub)]">暂无关联设定</p>
          <p className="mt-2 text-sm text-[var(--moge-text-muted)]">
            点击卡片上的"编辑"按钮添加角色、系统、世界观等设定
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 角色设定 */}
        {renderCategoryCard(
          'characters',
          '角色设定',
          <Users className="h-5 w-5" />,
          'text-blue-500',
          settings.characters
        )}

        {/* 系统/金手指 */}
        {renderCategoryCard(
          'systems',
          '系统/金手指',
          <Zap className="h-5 w-5" />,
          'text-yellow-500',
          settings.systems
        )}

        {/* 世界背景 */}
        {renderCategoryCard(
          'worlds',
          '世界背景',
          <Globe className="h-5 w-5" />,
          'text-green-500',
          settings.worlds
        )}

        {/* 辅助设定 */}
        {renderCategoryCard(
          'misc',
          '辅助设定',
          <Folder className="h-5 w-5" />,
          'text-purple-500',
          settings.misc
        )}
      </div>

      {/* 设定选择器对话框 */}
      {currentCategoryConfig && (
        <SettingSelectorDialog
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          category={currentCategory}
          categoryLabel={currentCategoryConfig.label}
          selectedIds={getSelectedIds(currentCategory)}
          onConfirm={(selectedIds) => {
            void handleConfirmSelection(selectedIds);
          }}
          Icon={currentCategoryConfig.icon}
          color={currentCategoryConfig.color}
        />
      )}
    </div>
  );
}
