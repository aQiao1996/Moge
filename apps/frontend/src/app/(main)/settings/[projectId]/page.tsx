'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Users,
  Zap,
  Globe,
  Folder,
  Plus,
  Eye,
  AlertCircle,
  Bot,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  getProjectAiConfig,
  getProjectById,
  getProjectSettings,
  updateProjectAiConfig,
  type ProjectAiConfig,
  type Project,
  type ProjectSettings,
} from '@/api/projects.api';
import dayjs from '@/lib/dayjs';
import { toast } from 'sonner';
import type {
  AIProviderValue,
  AiContextLengthStrategyValue,
  AiResultApplyStrategyValue,
} from '@moge/types';

type SettingCategoryKey = keyof ProjectSettings;
type ProjectSettingItem = ProjectSettings[SettingCategoryKey][number];

const categoryMeta: Array<{
  key: SettingCategoryKey;
  label: string;
  icon: typeof Users;
  description: string;
  color: string;
}> = [
  {
    key: 'characters',
    label: '角色设定',
    icon: Users,
    description: '管理小说中的主要角色、配角和反派角色',
    color: 'text-blue-500',
  },
  {
    key: 'systems',
    label: '系统/金手指',
    icon: Zap,
    description: '配置升级系统、签到系统、抽奖系统等',
    color: 'text-yellow-500',
  },
  {
    key: 'worlds',
    label: '世界背景',
    icon: Globe,
    description: '构建世界观、势力组织、修炼体系等',
    color: 'text-green-500',
  },
  {
    key: 'misc',
    label: '辅助设定',
    icon: Folder,
    description: '小说标签、分类管理、灵感记录等',
    color: 'text-purple-500',
  },
];

const emptySettings: ProjectSettings = {
  characters: [],
  systems: [],
  worlds: [],
  misc: [],
};

const aiProviderOptions: Array<{ value: AIProviderValue; label: string }> = [
  { value: 'openai_compatible', label: 'OpenAI 兼容' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'moonshot', label: 'Moonshot' },
  { value: 'gemini', label: 'Gemini' },
];

const contextStrategyOptions: Array<{ value: AiContextLengthStrategyValue; label: string }> = [
  { value: 'COMPACT', label: '紧凑' },
  { value: 'BALANCED', label: '均衡' },
  { value: 'EXPANDED', label: '扩展' },
];

const applyStrategyOptions: Array<{ value: AiResultApplyStrategyValue; label: string }> = [
  { value: 'CANDIDATE', label: '候选结果' },
  { value: 'DIRECT_INSERT', label: '直接插入' },
];

const contextToggleOptions: Array<{ key: keyof ProjectAiConfig; label: string }> = [
  { key: 'enableCharacterContext', label: '角色' },
  { key: 'enableSystemContext', label: '系统' },
  { key: 'enableWorldContext', label: '世界' },
  { key: 'enableMiscContext', label: '辅助' },
  { key: 'enableChapterSummaryContext', label: '章节摘要' },
  { key: 'enableProjectMemoryContext', label: '项目记忆' },
];

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<ProjectSettings>(emptySettings);
  const [aiConfig, setAiConfig] = useState<ProjectAiConfig | null>(null);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const totalSettings = useMemo(
    () => categoryMeta.reduce((sum, category) => sum + settings[category.key].length, 0),
    [settings]
  );

  useEffect(() => {
    const loadProjectDetail = async () => {
      if (!Number.isInteger(projectId) || projectId <= 0) {
        setErrorMessage('项目 ID 不正确');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');
        const [projectData, settingsData, aiConfigData] = await Promise.all([
          getProjectById(projectId),
          getProjectSettings(projectId),
          getProjectAiConfig(projectId),
        ]);
        setProject(projectData);
        setSettings(settingsData);
        setAiConfig(aiConfigData);
      } catch (error) {
        console.error('加载项目详情失败:', error);
        setErrorMessage('项目不存在或无权限访问');
      } finally {
        setLoading(false);
      }
    };

    void loadProjectDetail();
  }, [projectId]);

  const handleCategoryClick = (categoryKey: SettingCategoryKey) => {
    router.push(`/settings/library/${categoryKey}`);
  };

  const updateAiConfigField = <K extends keyof ProjectAiConfig>(
    key: K,
    value: ProjectAiConfig[K]
  ) => {
    setAiConfig((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSaveAiConfig = async () => {
    if (!aiConfig) return;

    try {
      setSavingAiConfig(true);
      const savedConfig = await updateProjectAiConfig(projectId, {
        provider: aiConfig.provider,
        model: aiConfig.model,
        temperature: Number(aiConfig.temperature),
        maxTokens: aiConfig.maxTokens,
        enableCharacterContext: aiConfig.enableCharacterContext,
        enableSystemContext: aiConfig.enableSystemContext,
        enableWorldContext: aiConfig.enableWorldContext,
        enableMiscContext: aiConfig.enableMiscContext,
        enableChapterSummaryContext: aiConfig.enableChapterSummaryContext,
        enableProjectMemoryContext: aiConfig.enableProjectMemoryContext,
        contextLengthStrategy: aiConfig.contextLengthStrategy,
        resultApplyStrategy: aiConfig.resultApplyStrategy,
        asyncTaskThreshold: aiConfig.asyncTaskThreshold,
      });
      setAiConfig(savedConfig);
      toast.success('AI 配置已保存');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 配置保存失败');
    } finally {
      setSavingAiConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage || !project) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              设定集
            </Button>
          </Link>
        </div>
        <Card className="border p-10 text-center">
          <AlertCircle className="text-destructive mx-auto mb-3 h-8 w-8" />
          <p className="text-[var(--moge-text-sub)]">{errorMessage || '项目不存在'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            设定集
          </Button>
        </Link>
        <span className="text-[var(--moge-text-muted)]">/</span>
        <span className="font-medium text-[var(--moge-text-main)]">{project.name}</span>
      </div>

      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">
              {project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {project.type}
              </Badge>
              <span className="text-sm text-[var(--moge-text-muted)]">
                创建于 {dayjs(project.createdAt).format('YYYY-MM-DD')}
              </span>
              <span className="text-sm text-[var(--moge-text-muted)]">
                更新于 {dayjs(project.updatedAt).fromNow()}
              </span>
            </div>
            {project.description && (
              <p className="mt-3 max-w-3xl text-sm text-[var(--moge-text-sub)]">
                {project.description}
              </p>
            )}
            {project.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-[var(--moge-text-sub)]">关联设定总数</p>
            <p className="text-2xl font-bold text-[var(--moge-text-main)]">{totalSettings}</p>
          </div>
        </div>
      </div>

      {aiConfig && (
        <Card
          className="mb-6 border p-6"
          style={{
            backgroundColor: 'var(--moge-card-bg)',
            borderColor: 'var(--moge-card-border)',
          }}
        >
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-[var(--moge-primary)]" />
              <div>
                <h2 className="text-lg font-semibold text-[var(--moge-text-main)]">AI 配置</h2>
                <p className="text-sm text-[var(--moge-text-sub)]">
                  模型、上下文与生成结果应用策略
                </p>
              </div>
            </div>
            <Button onClick={() => void handleSaveAiConfig()} disabled={savingAiConfig}>
              <Save className="mr-2 h-4 w-4" />
              {savingAiConfig ? '保存中' : '保存配置'}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>供应商</Label>
              <Select
                value={aiConfig.provider}
                onValueChange={(value: AIProviderValue) => updateAiConfigField('provider', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiProviderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>模型</Label>
              <Input
                value={aiConfig.model}
                onChange={(event) => updateAiConfigField('model', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>温度</Label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.01"
                value={aiConfig.temperature}
                onChange={(event) => updateAiConfigField('temperature', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>最大 token</Label>
              <Input
                type="number"
                min="1"
                value={aiConfig.maxTokens}
                onChange={(event) =>
                  updateAiConfigField('maxTokens', Number(event.target.value || 0))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>上下文策略</Label>
              <Select
                value={aiConfig.contextLengthStrategy}
                onValueChange={(value: AiContextLengthStrategyValue) =>
                  updateAiConfigField('contextLengthStrategy', value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contextStrategyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>应用策略</Label>
              <Select
                value={aiConfig.resultApplyStrategy}
                onValueChange={(value: AiResultApplyStrategyValue) =>
                  updateAiConfigField('resultApplyStrategy', value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {applyStrategyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>后台任务阈值</Label>
              <Input
                type="number"
                min="0"
                value={aiConfig.asyncTaskThreshold}
                onChange={(event) =>
                  updateAiConfigField('asyncTaskThreshold', Number(event.target.value || 0))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label>上下文来源</Label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                {contextToggleOptions.map((option) => (
                  <label
                    key={option.key}
                    className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-[var(--moge-text-main)]"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(aiConfig[option.key])}
                      onChange={(event) => updateAiConfigField(option.key, event.target.checked)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {categoryMeta.map((category) => {
          const Icon = category.icon;
          const items = settings[category.key];
          return (
            <Card
              key={category.key}
              className="border p-6 transition-all duration-200 hover:shadow-[var(--moge-glow-card)]"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
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
                  <p className="text-2xl font-bold text-[var(--moge-text-main)]">{items.length}</p>
                  <p className="text-xs text-[var(--moge-text-muted)]">个设定</p>
                </div>
              </div>

              <div className="mt-4 min-h-16 space-y-2">
                {items.length > 0 ? (
                  items.slice(0, 3).map((item: ProjectSettingItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded border px-3 py-2"
                    >
                      <span className="truncate text-sm text-[var(--moge-text-main)]">
                        {item.name}
                      </span>
                      <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                        {item.tags?.[0] || item.type || '未分类'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded border border-dashed px-3 py-5 text-center text-sm text-[var(--moge-text-muted)]">
                    暂未关联{category.label}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  className="flex-1"
                  variant={items.length > 0 ? 'default' : 'outline'}
                  onClick={() => handleCategoryClick(category.key)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  查看设定库
                </Button>
                <Button
                  variant="outline"
                  title={`新建${category.label}`}
                  aria-label={`新建${category.label}`}
                  onClick={() => handleCategoryClick(category.key)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
