'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, Calendar, Users, Zap, Globe, Folder, Plus, Trash2, Tag } from 'lucide-react';
import { getProjectSettings } from '@/api/projects.api';
import SettingSelectorDialog from './SettingSelectorDialog';

interface SettingItem {
  id: number;
  name: string;
  background?: string | null;
  description?: string | null;
  tags?: string[];
}

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

interface ProjectDetailDialogProps {
  project: ProjectData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 项目详情弹窗组件
 * 展示项目的基本信息和关联的设定分类
 */
export default function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
}: ProjectDetailDialogProps) {
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

  // 设定选择器状态
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<{
    key: 'characters' | 'systems' | 'worlds' | 'misc';
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
  } | null>(null);

  /**
   * 加载项目关联的设定数据
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

  // 当项目或弹窗状态变化时加载数据
  useEffect(() => {
    if (open && project) {
      void loadProjectSettings();
    }
  }, [open, project]);

  if (!project) return null;

  // 计算设定总数
  const totalSettings =
    (project.characters?.length || 0) +
    (project.systems?.length || 0) +
    (project.worlds?.length || 0) +
    (project.misc?.length || 0);

  // 格式化日期
  const formatDate = (date: string | Date) => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  };

  /**
   * 打开设定选择器
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
   */
  const handleConfirmSelection = async (selectedIds: string[]) => {
    // TODO: 调用 API 更新项目关联的设定
    console.log('选中的设定 IDs:', selectedIds);
    // 重新加载项目设定
    await loadProjectSettings();
  };

  /**
   * 渲染设定卡片
   */
  const renderSettingCard = (
    setting: SettingItem,
    Icon: React.ComponentType<{ className?: string }>,
    color: string
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
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-600"
          title="移除关联"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  /**
   * 渲染设定分类标签页内容
   */
  const renderSettingsTab = (
    categoryKey: string,
    Icon: React.ComponentType<{ className?: string }>,
    color: string,
    label: string
  ) => {
    const settings = settingsData[categoryKey as keyof typeof settingsData] || [];

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
            onClick={() =>
              handleOpenSelector(
                categoryKey as 'characters' | 'systems' | 'worlds' | 'misc',
                label,
                Icon,
                color
              )
            }
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
            {settings.map((setting) => renderSettingCard(setting, Icon, color))}
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
                            <Badge key={index} variant="secondary" className="text-xs">
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
