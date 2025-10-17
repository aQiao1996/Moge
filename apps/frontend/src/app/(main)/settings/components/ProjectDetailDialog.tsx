'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import { BookOpen, Calendar, Users, Zap, Globe, Folder, Plus, Trash2, Tag } from 'lucide-react';
import {
  getProjectSettings,
  updateProjectCharacters,
  updateProjectSystems,
  updateProjectWorlds,
  updateProjectMisc,
} from '@/api/projects.api';
import { toast } from 'sonner';
import SettingSelectorDialog from './SettingSelectorDialog';

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
 * 项目数据接口
 */
interface ProjectData {
  id: string | number;
  name: string;
  type: string;
  description?: string | null;
  tags?: string[];
  createdAt: string | Date;
  updatedAt?: string | Date;
  characters?: string[];
  systems?: string[];
  worlds?: string[];
  misc?: string[];
}

/**
 * 项目详情对话框组件属性接口
 */
interface ProjectDetailDialogProps {
  project: ProjectData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void | Promise<void>;
}

/**
 * 项目详情弹窗组件
 * 展示项目的基本信息和关联的设定分类
 */
export default function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
  onUpdate,
}: ProjectDetailDialogProps) {
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
   * 加载项目关联的设定数据
   * 从后端获取该项目关联的所有设定详情
   */
  const loadProjectSettings = async () => {
    if (!project) return;

    try {
      const data = await getProjectSettings(Number(project.id));
      setSettingsData(data);
    } catch (error) {
      console.error('加载项目设定失败:', error);
    }
  };

  /**
   * 当项目或弹窗状态变化时加载数据
   */
  useEffect(() => {
    if (open && project) {
      void loadProjectSettings();
    }
  }, [open, project]);

  if (!project) return null;

  /**
   * 计算项目关联的设定总数
   */
  const totalSettings =
    (project.characters?.length || 0) +
    (project.systems?.length || 0) +
    (project.worlds?.length || 0) +
    (project.misc?.length || 0);

  /**
   * 格式化日期显示
   *
   * @param date 日期对象或字符串
   * @returns 格式化后的日期字符串
   */
  const formatDate = (date: string | Date) => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  };

  /**
   * 打开设定选择器
   *
   * @param key 设定分类键名
   * @param label 设定分类显示名称
   * @param Icon 图标组件
   * @param color 图标颜色
   */
  const handleOpenSelector = (
    key: 'characters' | 'systems' | 'worlds' | 'misc',
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    color: string
  ) => {
    setCurrentCategory({ key, label, Icon, color });
    setSelectorOpen(true);
  };

  /**
   * 确认选择设定
   * 更新项目关联的设定列表
   *
   * @param selectedIds 选中的设定 ID 列表
   */
  const handleConfirmSelection = async (selectedIds: string[]) => {
    if (!project || !currentCategory) return;

    try {
      const ids = selectedIds.map(Number);
      const projectId = Number(project.id);

      // 根据分类调用对应的 API
      switch (currentCategory.key) {
        case 'characters':
          await updateProjectCharacters(projectId, ids);
          break;
        case 'systems':
          await updateProjectSystems(projectId, ids);
          break;
        case 'worlds':
          await updateProjectWorlds(projectId, ids);
          break;
        case 'misc':
          await updateProjectMisc(projectId, ids);
          break;
      }

      toast.success('设定关联更新成功');

      // 重新加载项目设定
      await loadProjectSettings();

      // 通知父组件更新项目列表
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('更新项目设定失败:', error);
      toast.error('更新设定关联失败，请重试');
    }
  };

  /**
   * 移除设定关联
   * 从项目中移除指定的设定
   *
   * @param settingId 要移除的设定 ID
   * @param categoryKey 设定分类
   */
  const handleRemoveSetting = async (
    settingId: number,
    categoryKey: 'characters' | 'systems' | 'worlds' | 'misc'
  ) => {
    if (!project) return;

    try {
      const projectId = Number(project.id);

      // 获取当前分类的所有 ID，移除指定的 ID
      const currentIds = project[categoryKey] || [];
      const newIds = currentIds.filter((id) => String(id) !== String(settingId)).map(Number);

      // 根据分类调用对应的 API
      switch (categoryKey) {
        case 'characters':
          await updateProjectCharacters(projectId, newIds);
          break;
        case 'systems':
          await updateProjectSystems(projectId, newIds);
          break;
        case 'worlds':
          await updateProjectWorlds(projectId, newIds);
          break;
        case 'misc':
          await updateProjectMisc(projectId, newIds);
          break;
      }

      toast.success('已移除设定关联');

      // 重新加载项目设定
      await loadProjectSettings();

      // 通知父组件更新项目列表
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('移除设定关联失败:', error);
      toast.error('移除设定关联失败，请重试');
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
          description={`确定要将「${setting.name}」从项目中移除吗？`}
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

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm text-[var(--moge-text-sub)]">
              已关联 {settings.length} 个{label}
            </span>
          </div>
          <Button size="sm" onClick={() => handleOpenSelector(categoryKey, label, Icon, color)}>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--moge-primary-400)]" />
              {project.name}
            </DialogTitle>
          </DialogHeader>
        </div>

        <Tabs defaultValue="info" className="flex-1 overflow-hidden px-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="info" className="shrink-0">
              项目信息
            </TabsTrigger>
            <TabsTrigger value="characters" className="shrink-0">
              角色 ({project.characters?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="systems" className="shrink-0">
              系统 ({project.systems?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="worlds" className="shrink-0">
              世界 ({project.worlds?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="misc" className="shrink-0">
              辅助 ({project.misc?.length || 0})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto pb-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {/* 项目信息 Tab */}
            <TabsContent value="info" className="mt-0">
              <div className="space-y-6">
                {/* 基本信息 */}
                <Card
                  className="border p-6"
                  style={{
                    backgroundColor: 'var(--moge-card-bg)',
                    borderColor: 'var(--moge-card-border)',
                  }}
                >
                  <h3 className="mb-4 font-semibold text-[var(--moge-text-main)]">基本信息</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-sm text-[var(--moge-text-muted)]">项目名称</span>
                      <span className="flex-1 text-sm text-[var(--moge-text-main)]">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-sm text-[var(--moge-text-muted)]">小说类型</span>
                      <Badge variant="outline" className="text-xs">
                        {project.type}
                      </Badge>
                    </div>
                    {project.description && (
                      <div className="flex items-start gap-3">
                        <span className="w-20 text-sm text-[var(--moge-text-muted)]">项目描述</span>
                        <span className="flex-1 text-sm text-[var(--moge-text-sub)]">
                          {project.description}
                        </span>
                      </div>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="w-20 text-sm text-[var(--moge-text-muted)]">标签</span>
                        <div className="flex flex-1 flex-wrap gap-1">
                          {project.tags.map((tag, index) => (
                            <Badge
                              key={`${project.id}-${tag}-${index}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              <Tag className="mr-1 h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-sm text-[var(--moge-text-muted)]">创建时间</span>
                      <span className="flex-1 text-sm text-[var(--moge-text-sub)]">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* 设定统计 */}
                <Card
                  className="border p-6"
                  style={{
                    backgroundColor: 'var(--moge-card-bg)',
                    borderColor: 'var(--moge-card-border)',
                  }}
                >
                  <h3 className="mb-6 font-semibold text-[var(--moge-text-main)]">设定统计</h3>
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Users className="h-10 w-10 text-blue-500" />
                      <div>
                        <p className="text-xs text-[var(--moge-text-muted)]">角色设定</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--moge-text-main)]">
                          {project.characters?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Zap className="h-10 w-10 text-yellow-500" />
                      <div>
                        <p className="text-xs text-[var(--moge-text-muted)]">系统设定</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--moge-text-main)]">
                          {project.systems?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Globe className="h-10 w-10 text-green-500" />
                      <div>
                        <p className="text-xs text-[var(--moge-text-muted)]">世界设定</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--moge-text-main)]">
                          {project.worlds?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Folder className="h-10 w-10 text-purple-500" />
                      <div>
                        <p className="text-xs text-[var(--moge-text-muted)]">辅助设定</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--moge-text-main)]">
                          {project.misc?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-6 border-t pt-6"
                    style={{ borderColor: 'var(--moge-card-border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base text-[var(--moge-text-sub)]">设定总数</span>
                      <span className="text-3xl font-bold text-[var(--moge-text-main)]">
                        {totalSettings}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

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
      </DialogContent>

      {/* 设定选择器弹窗 */}
      {currentCategory && (
        <SettingSelectorDialog
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          category={currentCategory.key}
          categoryLabel={currentCategory.label}
          selectedIds={project[currentCategory.key] || []}
          onConfirm={(selectedIds) => {
            void handleConfirmSelection(selectedIds);
          }}
          Icon={currentCategory.Icon}
          color={currentCategory.color}
        />
      )}
    </Dialog>
  );
}
