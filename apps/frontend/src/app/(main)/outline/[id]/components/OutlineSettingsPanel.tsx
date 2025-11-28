'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import { Users, Zap, Globe, Folder, Plus, Trash2 } from 'lucide-react';
import {
  getOutlineSettingsApi,
  updateOutlineCharactersApi,
  updateOutlineSystemsApi,
  updateOutlineWorldsApi,
  updateOutlineMiscApi,
} from '@/api/outline.api';
import { toast } from 'sonner';
import SettingSelectorDialog from '@/app/(main)/settings/components/SettingSelectorDialog';

/**
 * 设定项数据接口
 */
interface SettingItem {
  id: number;
  name: string;
  background?: string | null;
  description?: string | null;
  tags?: string[];
}

/**
 * 大纲设定管理面板组件属性接口
 */
interface OutlineSettingsPanelProps {
  outlineId: string;
  onUpdate?: () => void | Promise<void>;
}

/**
 * 大纲设定管理面板组件
 *
 * 功能：
 * - 展示大纲已关联的设定列表（角色、系统、世界、辅助）
 * - 支持从设定库添加设定
 * - 支持移除已关联的设定
 */
export default function OutlineSettingsPanel({ outlineId, onUpdate }: OutlineSettingsPanelProps) {
  /**
   * 设定数据,包含各分类的设定列表
   */
  const [settingsData, setSettingsData] = useState<{
    characters: SettingItem[];
    systems: SettingItem[];
    worlds: SettingItem[];
    misc: SettingItem[];
  }>({
    characters: [],
    systems: [],
    worlds: [],
    misc: [],
  });

  /**
   * 设定选择器状态管理
   */
  const [selectorOpen, setSelectorOpen] = useState(false);
  /**
   * 当前操作的设定分类信息
   */
  const [currentCategory, setCurrentCategory] = useState<{
    key: 'characters' | 'systems' | 'worlds' | 'misc';
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
  } | null>(null);

  /**
   * 当前关联的设定 ID 列表（用于选择器回显）
   */
  const [currentSettingIds, setCurrentSettingIds] = useState<string[]>([]);

  /**
   * 加载大纲关联的设定数据
   * 从后端获取该大纲关联的所有设定详情
   */
  const loadOutlineSettings = async () => {
    try {
      const data = await getOutlineSettingsApi(outlineId);
      setSettingsData(data);
    } catch (error) {
      console.error('加载大纲设定失败:', error);
    }
  };

  /**
   * 组件挂载时加载数据
   */
  useEffect(() => {
    void loadOutlineSettings();
  }, [outlineId]);

  /**
   * 打开设定选择器
   *
   * @param key 设定分类键名
   * @param label 设定分类显示名称
   * @param Icon 图标组件
   * @param color 图标颜色
   * @param currentIds 当前已关联的设定 ID 列表
   */
  const handleOpenSelector = (
    key: 'characters' | 'systems' | 'worlds' | 'misc',
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    color: string,
    currentIds: string[]
  ) => {
    setCurrentCategory({ key, label, Icon, color });
    setCurrentSettingIds(currentIds);
    setSelectorOpen(true);
  };

  /**
   * 确认选择设定
   * 更新大纲关联的设定列表
   *
   * @param selectedIds 选中的设定 ID 列表
   */
  const handleConfirmSelection = async (selectedIds: string[]) => {
    if (!currentCategory) return;

    try {
      const ids = selectedIds.map(Number);

      // 根据分类调用对应的 API
      switch (currentCategory.key) {
        case 'characters':
          await updateOutlineCharactersApi(outlineId, ids);
          break;
        case 'systems':
          await updateOutlineSystemsApi(outlineId, ids);
          break;
        case 'worlds':
          await updateOutlineWorldsApi(outlineId, ids);
          break;
        case 'misc':
          await updateOutlineMiscApi(outlineId, ids);
          break;
      }

      toast.success('设定关联更新成功');

      // 重新加载大纲设定
      await loadOutlineSettings();

      // 通知父组件更新
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('更新大纲设定失败:', error);
    }
  };

  /**
   * 移除设定关联
   * 从大纲中移除指定的设定
   *
   * @param settingId 要移除的设定 ID
   * @param categoryKey 设定分类
   */
  const handleRemoveSetting = async (
    settingId: number,
    categoryKey: 'characters' | 'systems' | 'worlds' | 'misc'
  ) => {
    try {
      // 获取当前分类的所有设定，移除指定的设定
      const currentSettings = settingsData[categoryKey] || [];
      const newIds = currentSettings
        .filter((setting) => setting.id !== settingId)
        .map((setting) => setting.id);

      // 根据分类调用对应的 API
      switch (categoryKey) {
        case 'characters':
          await updateOutlineCharactersApi(outlineId, newIds);
          break;
        case 'systems':
          await updateOutlineSystemsApi(outlineId, newIds);
          break;
        case 'worlds':
          await updateOutlineWorldsApi(outlineId, newIds);
          break;
        case 'misc':
          await updateOutlineMiscApi(outlineId, newIds);
          break;
      }

      toast.success('已移除设定关联');

      // 重新加载大纲设定
      await loadOutlineSettings();

      // 通知父组件更新
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('移除设定关联失败:', error);
    }
  };

  /**
   * 渲染设定卡片
   *
   * @param setting 设定数据
   * @param Icon 图标组件
   * @param color 图标颜色
   * @param categoryKey 设定分类
   * @returns 设定卡片 JSX 元素
   */
  const renderSettingCard = (
    setting: SettingItem,
    Icon: React.ComponentType<{ className?: string }>,
    color: string,
    categoryKey: 'characters' | 'systems' | 'worlds' | 'misc'
  ) => (
    <Card
      key={setting.id}
      className="border p-4"
      style={{
        backgroundColor: 'var(--moge-card-bg)',
        borderColor: 'var(--moge-card-border)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <h4 className="font-medium text-[var(--moge-text-main)]">{setting.name}</h4>
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-[var(--moge-text-sub)]">
            {setting.background || setting.description || '暂无描述'}
          </p>
          {setting.tags && setting.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {setting.tags.map((tag: string, index: number) => (
                <Badge
                  key={`${setting.id}-${tag}-${index}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <MogeConfirmPopover
          trigger={
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600"
              title="移除关联"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
          title="移除设定关联"
          description={`确定要将「${setting.name}」从大纲中移除吗？`}
          confirmText="确认移除"
          cancelText="取消"
          loadingText="移除中..."
          confirmVariant="destructive"
          onConfirm={() => handleRemoveSetting(setting.id, categoryKey)}
        />
      </div>
    </Card>
  );

  /**
   * 渲染设定分类标签页内容
   *
   * @param categoryKey 设定分类键名
   * @param Icon 图标组件
   * @param color 图标颜色
   * @param label 设定分类显示名称
   * @returns 标签页内容 JSX 元素
   */
  const renderSettingsTab = (
    categoryKey: 'characters' | 'systems' | 'worlds' | 'misc',
    Icon: React.ComponentType<{ className?: string }>,
    color: string,
    label: string
  ) => {
    const settings = settingsData[categoryKey] || [];
    const currentIds = settings.map((s) => String(s.id));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm text-[var(--moge-text-sub)]">
              已关联 {settings.length} 个{label}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenSelector(categoryKey, label, Icon, color, currentIds)}
          >
            <Plus className="mr-2 h-4 w-4" />
            从设定库添加
          </Button>
        </div>

        {settings.length === 0 ? (
          <Card
            className="border p-8 text-center"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <Icon className={`mx-auto mb-2 h-12 w-12 ${color} opacity-50`} />
            <p className="text-[var(--moge-text-sub)]">还没有关联{label}</p>
            <p className="mt-1 text-xs text-[var(--moge-text-muted)]">点击上方按钮从设定库添加</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {settings.map((setting) => renderSettingCard(setting, Icon, color, categoryKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="characters" className="shrink-0">
            角色 ({settingsData.characters.length})
          </TabsTrigger>
          <TabsTrigger value="systems" className="shrink-0">
            系统 ({settingsData.systems.length})
          </TabsTrigger>
          <TabsTrigger value="worlds" className="shrink-0">
            世界 ({settingsData.worlds.length})
          </TabsTrigger>
          <TabsTrigger value="misc" className="shrink-0">
            辅助 ({settingsData.misc.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {/* 角色设定 Tab */}
          <TabsContent value="characters" className="mt-0">
            {renderSettingsTab('characters', Users, 'text-blue-500', '角色设定')}
          </TabsContent>

          {/* 系统设定 Tab */}
          <TabsContent value="systems" className="mt-0">
            {renderSettingsTab('systems', Zap, 'text-yellow-500', '系统设定')}
          </TabsContent>

          {/* 世界设定 Tab */}
          <TabsContent value="worlds" className="mt-0">
            {renderSettingsTab('worlds', Globe, 'text-green-500', '世界设定')}
          </TabsContent>

          {/* 辅助设定 Tab */}
          <TabsContent value="misc" className="mt-0">
            {renderSettingsTab('misc', Folder, 'text-purple-500', '辅助设定')}
          </TabsContent>
        </div>
      </Tabs>

      {/* 设定选择器弹窗 */}
      {currentCategory && (
        <SettingSelectorDialog
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          category={currentCategory.key}
          categoryLabel={currentCategory.label}
          selectedIds={currentSettingIds}
          onConfirm={(selectedIds) => {
            void handleConfirmSelection(selectedIds);
          }}
          Icon={currentCategory.Icon}
          color={currentCategory.color}
        />
      )}
    </>
  );
}
