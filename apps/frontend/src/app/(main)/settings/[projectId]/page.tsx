'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Copy,
  Users,
  Zap,
  Globe,
  Folder,
  Plus,
  Eye,
  AlertCircle,
  Bot,
  Save,
  History,
  Brain,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  appendProjectPromptPresetVersion,
  appendUserPromptPresetVersion,
  cloneProjectPromptPreset,
  createProjectPromptPreset,
  createUserPromptPreset,
  createProjectMemoryItem,
  createProjectKnowledgeDocument,
  disableProjectPromptPreset,
  disableUserPromptPreset,
  deleteProjectKnowledgeDocument,
  deleteProjectMemoryItem,
  getProjectAiConfig,
  getProjectById,
  getProjectKnowledgeDocuments,
  getProjectMemoryItems,
  getProjectPromptPresets,
  getProjectSettings,
  updateProjectPromptPreset,
  updateUserPromptPreset,
  updateProjectKnowledgeDocument,
  updateProjectMemoryItem,
  updateProjectAiConfig,
  type ProjectAiConfig,
  type ProjectKnowledgeDocument,
  type ProjectMemoryItem,
  type Project,
  type ProjectSettings,
  type UpdateProjectAiConfigPayload,
} from '@/api/projects.api';
import dayjs from '@/lib/dayjs';
import { toast } from 'sonner';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import type {
  AIProviderValue,
  AiContextLengthStrategyValue,
  AiPromptPreset,
  AiTaskType,
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

const promptTaskOptions: Array<{ value: AiTaskType; label: string }> = [
  { value: 'OUTLINE_GENERATE', label: '大纲生成' },
  { value: 'MANUSCRIPT_CONTINUE', label: '续写' },
  { value: 'MANUSCRIPT_POLISH', label: '润色' },
  { value: 'MANUSCRIPT_EXPAND', label: '扩写' },
];

const defaultPromptForm = {
  scope: 'PROJECT' as 'PROJECT' | 'USER',
  taskType: 'MANUSCRIPT_CONTINUE' as AiTaskType,
  name: '',
  code: '',
  systemPrompt: '',
  userPromptTemplate: '',
  notes: '',
};

const defaultPromptVersionForm = {
  presetId: '',
  systemPrompt: '',
  userPromptTemplate: '',
  notes: '',
};

const defaultPromptMetaForm = {
  code: '',
  name: '',
  description: '',
};

const defaultMemoryForm = {
  category: 'STYLE',
  title: '',
  content: '',
  priority: '0',
};

const defaultKnowledgeDocumentForm = {
  title: '',
  documentType: 'NOTE',
  content: '',
  source: 'MANUAL',
};

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<ProjectSettings>(emptySettings);
  const [aiConfig, setAiConfig] = useState<ProjectAiConfig | null>(null);
  const [promptPresets, setPromptPresets] = useState<AiPromptPreset[]>([]);
  const [projectMemoryItems, setProjectMemoryItems] = useState<ProjectMemoryItem[]>([]);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<ProjectKnowledgeDocument[]>([]);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [creatingPreset, setCreatingPreset] = useState(false);
  const [appendingPresetVersion, setAppendingPresetVersion] = useState(false);
  const [savingPromptMeta, setSavingPromptMeta] = useState(false);
  const [editingPromptPresetId, setEditingPromptPresetId] = useState<number | null>(null);
  const [cloningPresetId, setCloningPresetId] = useState<number | null>(null);
  const [disablingPresetId, setDisablingPresetId] = useState<number | null>(null);
  const [savingMemoryItem, setSavingMemoryItem] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<number | null>(null);
  const [savingKnowledgeDocument, setSavingKnowledgeDocument] = useState(false);
  const [editingKnowledgeDocumentId, setEditingKnowledgeDocumentId] = useState<number | null>(null);
  const [promptForm, setPromptForm] = useState(defaultPromptForm);
  const [promptMetaForm, setPromptMetaForm] = useState(defaultPromptMetaForm);
  const [promptVersionForm, setPromptVersionForm] = useState(defaultPromptVersionForm);
  const [memoryForm, setMemoryForm] = useState(defaultMemoryForm);
  const [knowledgeDocumentForm, setKnowledgeDocumentForm] = useState(defaultKnowledgeDocumentForm);
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
        const [
          projectData,
          settingsData,
          aiConfigData,
          promptPresetData,
          memoryItemsData,
          knowledgeDocumentData,
        ] = await Promise.all([
          getProjectById(projectId),
          getProjectSettings(projectId),
          getProjectAiConfig(projectId),
          getProjectPromptPresets(projectId),
          getProjectMemoryItems(projectId),
          getProjectKnowledgeDocuments(projectId),
        ]);
        setProject(projectData);
        setSettings(settingsData);
        setAiConfig(aiConfigData);
        setPromptPresets(promptPresetData);
        setProjectMemoryItems(memoryItemsData);
        setKnowledgeDocuments(knowledgeDocumentData);
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

  const getPromptPresetOptions = (taskType: AiPromptPreset['taskType']) => {
    return promptPresets.filter((preset) => preset.taskType === taskType && preset.isEnabled);
  };

  const managedPromptPresets = useMemo(
    () => promptPresets.filter((preset) => preset.scope === 'PROJECT' || preset.scope === 'USER'),
    [promptPresets]
  );

  const cloneablePromptPresets = useMemo(
    () => promptPresets.filter((preset) => preset.isEnabled),
    [promptPresets]
  );

  const getTaskLabel = (taskType?: AiTaskType) => {
    if (!taskType) {
      return '未知类型';
    }

    return promptTaskOptions.find((option) => option.value === taskType)?.label ?? taskType;
  };

  const getScopeLabel = (scope?: AiPromptPreset['scope']) => {
    if (scope === 'SYSTEM') {
      return '系统';
    }

    if (scope === 'USER') {
      return '个人';
    }

    return '项目';
  };

  const replacePromptPreset = (updatedPreset: AiPromptPreset) => {
    setPromptPresets((current) =>
      current.map((preset) => (preset.id === updatedPreset.id ? updatedPreset : preset))
    );
  };

  const appendPromptPreset = (createdPreset: AiPromptPreset) => {
    setPromptPresets((current) => {
      if (current.some((preset) => preset.id === createdPreset.id)) {
        return current.map((preset) => (preset.id === createdPreset.id ? createdPreset : preset));
      }

      return [...current, createdPreset];
    });
  };

  const findPromptPreset = (presetId: number) => {
    return promptPresets.find((preset) => preset.id === presetId);
  };

  const updatePresetField = (
    key:
      | 'defaultContinuePresetId'
      | 'defaultPolishPresetId'
      | 'defaultExpandPresetId'
      | 'defaultOutlinePresetId',
    value: string
  ) => {
    updateAiConfigField(key, value === 'none' ? null : Number(value));
  };

  const updatePromptFormField = <K extends keyof typeof defaultPromptForm>(
    key: K,
    value: (typeof defaultPromptForm)[K]
  ) => {
    setPromptForm((current) => ({ ...current, [key]: value }));
  };

  const updatePromptVersionFormField = <K extends keyof typeof defaultPromptVersionForm>(
    key: K,
    value: (typeof defaultPromptVersionForm)[K]
  ) => {
    setPromptVersionForm((current) => ({ ...current, [key]: value }));
  };

  const updatePromptMetaFormField = <K extends keyof typeof defaultPromptMetaForm>(
    key: K,
    value: (typeof defaultPromptMetaForm)[K]
  ) => {
    setPromptMetaForm((current) => ({ ...current, [key]: value }));
  };

  const updateMemoryFormField = <K extends keyof typeof defaultMemoryForm>(
    key: K,
    value: (typeof defaultMemoryForm)[K]
  ) => {
    setMemoryForm((current) => ({ ...current, [key]: value }));
  };

  const updateKnowledgeDocumentFormField = <K extends keyof typeof defaultKnowledgeDocumentForm>(
    key: K,
    value: (typeof defaultKnowledgeDocumentForm)[K]
  ) => {
    setKnowledgeDocumentForm((current) => ({ ...current, [key]: value }));
  };

  const resetMemoryForm = () => {
    setMemoryForm(defaultMemoryForm);
    setEditingMemoryId(null);
  };

  const resetKnowledgeDocumentForm = () => {
    setKnowledgeDocumentForm(defaultKnowledgeDocumentForm);
    setEditingKnowledgeDocumentId(null);
  };

  const getManagedPromptCodeSuffix = (preset: AiPromptPreset) => {
    const code = preset.code ?? '';
    if (preset.scope === 'USER') {
      return code.replace(/^user-\d+-/, '');
    }

    const prefix = `project-${projectId}-`;
    return code.startsWith(prefix) ? code.slice(prefix.length) : code;
  };

  const resetPromptMetaForm = () => {
    setPromptMetaForm(defaultPromptMetaForm);
    setEditingPromptPresetId(null);
  };

  const handleEditPromptPreset = (preset: AiPromptPreset) => {
    if (preset.id === undefined || !preset.code || !preset.name) {
      toast.error('Prompt 预设数据不完整，无法编辑');
      return;
    }

    setEditingPromptPresetId(preset.id);
    setPromptMetaForm({
      code: getManagedPromptCodeSuffix(preset),
      name: preset.name,
      description: preset.description ?? '',
    });
  };

  const handleEditMemoryItem = (item: ProjectMemoryItem) => {
    setEditingMemoryId(item.id);
    setMemoryForm({
      category: item.category,
      title: item.title,
      content: item.content,
      priority: String(item.priority),
    });
  };

  const handleEditKnowledgeDocument = (document: ProjectKnowledgeDocument) => {
    setEditingKnowledgeDocumentId(document.id);
    setKnowledgeDocumentForm({
      title: document.title,
      documentType: document.documentType,
      content: document.content,
      source: document.source,
    });
  };

  const handleCreatePromptPreset = async () => {
    const code = promptForm.code.trim();
    const name = promptForm.name.trim();
    const systemPrompt = promptForm.systemPrompt.trim();
    const userPromptTemplate = promptForm.userPromptTemplate.trim();

    if (!code || !name || !systemPrompt || !userPromptTemplate) {
      toast.error('请完整填写预设编码、名称和提示词');
      return;
    }

    try {
      setCreatingPreset(true);
      const createPromptPreset =
        promptForm.scope === 'USER' ? createUserPromptPreset : createProjectPromptPreset;
      const createdPreset = await createPromptPreset(projectId, {
        code,
        name,
        taskType: promptForm.taskType,
        systemPrompt,
        userPromptTemplate,
        outputFormat: 'TEXT',
        notes: promptForm.notes.trim() || undefined,
      });
      appendPromptPreset(createdPreset);
      setPromptForm(defaultPromptForm);
      toast.success('Prompt 预设已创建');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prompt 预设创建失败');
    } finally {
      setCreatingPreset(false);
    }
  };

  const handleAppendPromptPresetVersion = async () => {
    const presetId = Number(promptVersionForm.presetId);
    const preset = findPromptPreset(presetId);
    const systemPrompt = promptVersionForm.systemPrompt.trim();
    const userPromptTemplate = promptVersionForm.userPromptTemplate.trim();

    if (
      !Number.isInteger(presetId) ||
      presetId <= 0 ||
      !preset ||
      !systemPrompt ||
      !userPromptTemplate
    ) {
      toast.error('请选择自定义预设并填写新版本提示词');
      return;
    }

    try {
      setAppendingPresetVersion(true);
      const appendPresetVersion =
        preset.scope === 'USER' ? appendUserPromptPresetVersion : appendProjectPromptPresetVersion;
      const updatedPreset = await appendPresetVersion(projectId, presetId, {
        systemPrompt,
        userPromptTemplate,
        outputFormat: 'TEXT',
        notes: promptVersionForm.notes.trim() || undefined,
      });
      replacePromptPreset(updatedPreset);
      setPromptVersionForm(defaultPromptVersionForm);
      toast.success('Prompt 预设版本已追加');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prompt 预设版本追加失败');
    } finally {
      setAppendingPresetVersion(false);
    }
  };

  const handleClonePromptPreset = async (preset: AiPromptPreset) => {
    if (preset.id === undefined) {
      return;
    }

    try {
      setCloningPresetId(preset.id);
      const clonedPreset = await cloneProjectPromptPreset(projectId, preset.id);
      appendPromptPreset(clonedPreset);
      toast.success('Prompt 预设已克隆');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prompt 预设克隆失败');
    } finally {
      setCloningPresetId(null);
    }
  };

  const handleSavePromptPresetMeta = async () => {
    if (!editingPromptPresetId) {
      toast.error('请选择要编辑的自定义预设');
      return;
    }

    const preset = findPromptPreset(editingPromptPresetId);
    if (!preset) {
      toast.error('Prompt 预设数据不完整，无法编辑');
      return;
    }

    const code = promptMetaForm.code.trim();
    const name = promptMetaForm.name.trim();
    const description = promptMetaForm.description.trim();

    if (!code || !name) {
      toast.error('请填写预设编码和名称');
      return;
    }

    try {
      setSavingPromptMeta(true);
      const updatePromptPreset =
        preset.scope === 'USER' ? updateUserPromptPreset : updateProjectPromptPreset;
      const updatedPreset = await updatePromptPreset(projectId, editingPromptPresetId, {
        code,
        name,
        description: description || undefined,
      });
      replacePromptPreset(updatedPreset);
      resetPromptMetaForm();
      toast.success('Prompt 预设已更新');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prompt 预设更新失败');
    } finally {
      setSavingPromptMeta(false);
    }
  };

  const clearDefaultPresetReference = (preset: AiPromptPreset) => {
    setAiConfig((current) => {
      if (!current) return current;

      if (preset.taskType === 'MANUSCRIPT_CONTINUE') {
        return { ...current, defaultContinuePresetId: null };
      }

      if (preset.taskType === 'MANUSCRIPT_POLISH') {
        return { ...current, defaultPolishPresetId: null };
      }

      if (preset.taskType === 'MANUSCRIPT_EXPAND') {
        return { ...current, defaultExpandPresetId: null };
      }

      if (preset.taskType === 'OUTLINE_GENERATE') {
        return { ...current, defaultOutlinePresetId: null };
      }

      return current;
    });
  };

  const handleDisablePromptPreset = async (preset: AiPromptPreset) => {
    if (preset.id === undefined) {
      return;
    }

    try {
      setDisablingPresetId(preset.id);
      const disablePromptPreset =
        preset.scope === 'USER' ? disableUserPromptPreset : disableProjectPromptPreset;
      const disabledPreset = await disablePromptPreset(projectId, preset.id);
      replacePromptPreset(disabledPreset);
      clearDefaultPresetReference(disabledPreset);
      toast.success('Prompt 预设已停用');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prompt 预设停用失败');
    } finally {
      setDisablingPresetId(null);
    }
  };

  const handleSaveMemoryItem = async () => {
    const category = memoryForm.category.trim();
    const title = memoryForm.title.trim();
    const content = memoryForm.content.trim();
    const priority = Number(memoryForm.priority || 0);

    if (!category || !title || !content) {
      toast.error('请完整填写项目记忆分类、标题和内容');
      return;
    }

    if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
      toast.error('项目记忆优先级需为 0-100 的整数');
      return;
    }

    try {
      setSavingMemoryItem(true);
      const payload = {
        category,
        title,
        content,
        priority,
      };

      if (editingMemoryId) {
        const updated = await updateProjectMemoryItem(projectId, editingMemoryId, payload);
        setProjectMemoryItems((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        toast.success('项目记忆已更新');
      } else {
        const created = await createProjectMemoryItem(projectId, payload);
        setProjectMemoryItems((current) => [created, ...current]);
        toast.success('项目记忆已创建');
      }

      resetMemoryForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '项目记忆保存失败');
    } finally {
      setSavingMemoryItem(false);
    }
  };

  const handleDeleteMemoryItem = async (memoryId: number) => {
    try {
      await deleteProjectMemoryItem(projectId, memoryId);
      setProjectMemoryItems((current) => current.filter((item) => item.id !== memoryId));
      toast.success('项目记忆已删除');
      if (editingMemoryId === memoryId) {
        resetMemoryForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '项目记忆删除失败');
    }
  };

  const handleSaveKnowledgeDocument = async () => {
    const title = knowledgeDocumentForm.title.trim();
    const documentType = knowledgeDocumentForm.documentType.trim();
    const content = knowledgeDocumentForm.content.trim();
    const source = knowledgeDocumentForm.source.trim() || undefined;

    if (!title || !documentType || !content) {
      toast.error('请完整填写资料标题、类型和内容');
      return;
    }

    try {
      setSavingKnowledgeDocument(true);
      const payload = {
        title,
        documentType,
        content,
        source,
      };

      if (editingKnowledgeDocumentId) {
        const updated = await updateProjectKnowledgeDocument(
          projectId,
          editingKnowledgeDocumentId,
          payload
        );
        setKnowledgeDocuments((current) =>
          current.map((document) => (document.id === updated.id ? updated : document))
        );
        toast.success('项目资料已更新');
      } else {
        const created = await createProjectKnowledgeDocument(projectId, payload);
        setKnowledgeDocuments((current) => [created, ...current]);
        toast.success('项目资料已创建');
      }

      resetKnowledgeDocumentForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '项目资料保存失败');
    } finally {
      setSavingKnowledgeDocument(false);
    }
  };

  const handleDeleteKnowledgeDocument = async (documentId: number) => {
    try {
      await deleteProjectKnowledgeDocument(projectId, documentId);
      setKnowledgeDocuments((current) => current.filter((document) => document.id !== documentId));
      toast.success('项目资料已删除');
      if (editingKnowledgeDocumentId === documentId) {
        resetKnowledgeDocumentForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '项目资料删除失败');
    }
  };

  const handleSaveAiConfig = async () => {
    if (!aiConfig) return;

    try {
      setSavingAiConfig(true);
      const updatePayload: UpdateProjectAiConfigPayload = {
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
        defaultContinuePresetId: aiConfig.defaultContinuePresetId ?? null,
        defaultPolishPresetId: aiConfig.defaultPolishPresetId ?? null,
        defaultExpandPresetId: aiConfig.defaultExpandPresetId ?? null,
        defaultOutlinePresetId: aiConfig.defaultOutlinePresetId ?? null,
      };
      const savedConfig = await updateProjectAiConfig(projectId, updatePayload);
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

            <div className="space-y-2">
              <Label>续写预设</Label>
              <Select
                value={aiConfig.defaultContinuePresetId?.toString() ?? 'none'}
                onValueChange={(value) => updatePresetField('defaultContinuePresetId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">系统默认</SelectItem>
                  {getPromptPresetOptions('MANUSCRIPT_CONTINUE').map((preset) => (
                    <SelectItem key={preset.id} value={String(preset.id)}>
                      {preset.name} · {getScopeLabel(preset.scope)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>大纲预设</Label>
              <Select
                value={aiConfig.defaultOutlinePresetId?.toString() ?? 'none'}
                onValueChange={(value) => updatePresetField('defaultOutlinePresetId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">系统默认</SelectItem>
                  {getPromptPresetOptions('OUTLINE_GENERATE').map((preset) => (
                    <SelectItem key={preset.id} value={String(preset.id)}>
                      {preset.name} · {getScopeLabel(preset.scope)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>润色预设</Label>
              <Select
                value={aiConfig.defaultPolishPresetId?.toString() ?? 'none'}
                onValueChange={(value) => updatePresetField('defaultPolishPresetId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">系统默认</SelectItem>
                  {getPromptPresetOptions('MANUSCRIPT_POLISH').map((preset) => (
                    <SelectItem key={preset.id} value={String(preset.id)}>
                      {preset.name} · {getScopeLabel(preset.scope)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>扩写预设</Label>
              <Select
                value={aiConfig.defaultExpandPresetId?.toString() ?? 'none'}
                onValueChange={(value) => updatePresetField('defaultExpandPresetId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">系统默认</SelectItem>
                  {getPromptPresetOptions('MANUSCRIPT_EXPAND').map((preset) => (
                    <SelectItem key={preset.id} value={String(preset.id)}>
                      {preset.name} · {getScopeLabel(preset.scope)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 md:col-span-4">
              <div>
                <Label>新建 Prompt 预设</Label>
                <p className="mt-1 text-xs text-[var(--moge-text-muted)]">
                  可用变量：{'{{settingsContext}}'}、{'{{currentContent}}'}、{'{{sourceText}}'}、
                  {'{{customPrompt}}'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <Select
                  value={promptForm.scope}
                  onValueChange={(value: 'PROJECT' | 'USER') =>
                    updatePromptFormField('scope', value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROJECT">项目预设</SelectItem>
                    <SelectItem value="USER">个人预设</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={promptForm.taskType}
                  onValueChange={(value: AiTaskType) => updatePromptFormField('taskType', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {promptTaskOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="preset-code"
                  value={promptForm.code}
                  onChange={(event) => updatePromptFormField('code', event.target.value)}
                />
                <Input
                  placeholder="预设名称"
                  value={promptForm.name}
                  onChange={(event) => updatePromptFormField('name', event.target.value)}
                />
                <Input
                  placeholder="版本备注"
                  value={promptForm.notes}
                  onChange={(event) => updatePromptFormField('notes', event.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Textarea
                  placeholder="系统提示词"
                  value={promptForm.systemPrompt}
                  onChange={(event) => updatePromptFormField('systemPrompt', event.target.value)}
                  rows={5}
                />
                <Textarea
                  placeholder="用户提示词模板"
                  value={promptForm.userPromptTemplate}
                  onChange={(event) =>
                    updatePromptFormField('userPromptTemplate', event.target.value)
                  }
                  rows={5}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => void handleCreatePromptPreset()}
                  disabled={creatingPreset}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {creatingPreset ? '创建中' : '创建预设'}
                </Button>
              </div>
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

            <div className="space-y-4 md:col-span-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--moge-primary)]" />
                <Label>自定义 Prompt 预设</Label>
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <div>
                  <Label>克隆可用预设</Label>
                  <p className="mt-1 text-xs text-[var(--moge-text-muted)]">
                    将系统、个人或项目预设复制为新的项目级预设，便于继续追加版本。
                  </p>
                </div>
                {cloneablePromptPresets.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {cloneablePromptPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-[var(--moge-text-main)]">
                              {preset.name}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {getTaskLabel(preset.taskType)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getScopeLabel(preset.scope)}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-[var(--moge-text-muted)]">
                            {preset.code}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                          disabled={cloningPresetId === preset.id}
                          onClick={() => void handleClonePromptPreset(preset)}
                        >
                          <Copy className="mr-1 h-4 w-4" />
                          {cloningPresetId === preset.id ? '克隆中' : '克隆'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded border border-dashed px-3 py-5 text-center text-sm text-[var(--moge-text-muted)]">
                    暂无可克隆 Prompt 预设
                  </p>
                )}
              </div>

              {managedPromptPresets.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {managedPromptPresets.map((preset) => {
                    const latestVersion = preset.versions?.[0];
                    return (
                      <div key={preset.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-[var(--moge-text-main)]">
                                {preset.name}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {getTaskLabel(preset.taskType)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getScopeLabel(preset.scope)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                v{preset.latestVersion}
                              </Badge>
                            </div>
                            <p className="mt-1 truncate text-xs text-[var(--moge-text-muted)]">
                              {preset.code}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <Badge variant={preset.isEnabled ? 'default' : 'outline'}>
                              {preset.isEnabled ? '启用' : '停用'}
                            </Badge>
                            {preset.isEnabled && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditPromptPreset(preset)}
                                >
                                  <Pencil className="mr-1 h-4 w-4" />
                                  编辑
                                </Button>
                                <MogeConfirmPopover
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={disablingPresetId === preset.id}
                                    >
                                      <Trash2 className="mr-1 h-4 w-4" />
                                      停用
                                    </Button>
                                  }
                                  title="停用 Prompt 预设"
                                  description="停用后不会再作为可选预设，也会清除对应任务的默认预设引用。历史版本仍会保留。"
                                  confirmText="停用"
                                  loadingText="停用中..."
                                  onConfirm={() => handleDisablePromptPreset(preset)}
                                />
                              </>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-2 text-xs text-[var(--moge-text-sub)]">
                          {latestVersion?.notes || preset.description || '暂无版本备注'}
                        </p>
                        {editingPromptPresetId === preset.id && (
                          <div className="mt-4 space-y-3 rounded-md border p-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <Input
                                placeholder="预设编码"
                                value={promptMetaForm.code}
                                onChange={(event) =>
                                  updatePromptMetaFormField('code', event.target.value)
                                }
                              />
                              <Input
                                placeholder="预设名称"
                                value={promptMetaForm.name}
                                onChange={(event) =>
                                  updatePromptMetaFormField('name', event.target.value)
                                }
                              />
                            </div>
                            <Textarea
                              placeholder="预设描述"
                              value={promptMetaForm.description}
                              onChange={(event) =>
                                updatePromptMetaFormField('description', event.target.value)
                              }
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={resetPromptMetaForm}>
                                取消
                              </Button>
                              <Button
                                onClick={() => void handleSavePromptPresetMeta()}
                                disabled={savingPromptMeta}
                              >
                                <Save className="mr-2 h-4 w-4" />
                                {savingPromptMeta ? '保存中' : '保存修改'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded border border-dashed px-3 py-5 text-center text-sm text-[var(--moge-text-muted)]">
                  暂无自定义 Prompt 预设
                </p>
              )}

              <div className="space-y-3 rounded-md border p-4">
                <div>
                  <Label>追加预设版本</Label>
                  <p className="mt-1 text-xs text-[var(--moge-text-muted)]">
                    新版本会成为该预设的最新版本，历史版本仍保留。
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Select
                    value={promptVersionForm.presetId}
                    onValueChange={(value) => updatePromptVersionFormField('presetId', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择自定义预设" />
                    </SelectTrigger>
                    <SelectContent>
                      {managedPromptPresets.map((preset) => (
                        <SelectItem key={preset.id} value={String(preset.id)}>
                          {preset.name} · {getScopeLabel(preset.scope)} · v{preset.latestVersion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="版本备注"
                    value={promptVersionForm.notes}
                    onChange={(event) => updatePromptVersionFormField('notes', event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Textarea
                    placeholder="新版本系统提示词"
                    value={promptVersionForm.systemPrompt}
                    onChange={(event) =>
                      updatePromptVersionFormField('systemPrompt', event.target.value)
                    }
                    rows={5}
                  />
                  <Textarea
                    placeholder="新版本用户提示词模板"
                    value={promptVersionForm.userPromptTemplate}
                    onChange={(event) =>
                      updatePromptVersionFormField('userPromptTemplate', event.target.value)
                    }
                    rows={5}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => void handleAppendPromptPresetVersion()}
                    disabled={appendingPresetVersion || managedPromptPresets.length === 0}
                  >
                    <History className="mr-2 h-4 w-4" />
                    {appendingPresetVersion ? '追加中' : '追加版本'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card
        className="mb-6 border p-6"
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
        }}
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-[var(--moge-primary)]" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--moge-text-main)]">项目记忆</h2>
              <p className="text-sm text-[var(--moge-text-sub)]">
                风格、禁忌、称谓和关系约束会在启用后进入 AI 上下文
              </p>
            </div>
          </div>
          <Badge variant="secondary">共 {projectMemoryItems.length} 条</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="space-y-3 rounded-md border p-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>分类</Label>
                <Input
                  value={memoryForm.category}
                  onChange={(event) => updateMemoryFormField('category', event.target.value)}
                  placeholder="STYLE"
                />
              </div>
              <div className="space-y-2">
                <Label>优先级</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={memoryForm.priority}
                  onChange={(event) => updateMemoryFormField('priority', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={memoryForm.title}
                onChange={(event) => updateMemoryFormField('title', event.target.value)}
                placeholder="叙事口吻"
              />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                value={memoryForm.content}
                onChange={(event) => updateMemoryFormField('content', event.target.value)}
                placeholder="保持冷静克制的第三人称。"
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editingMemoryId && (
                <Button variant="outline" onClick={resetMemoryForm}>
                  取消编辑
                </Button>
              )}
              <Button onClick={() => void handleSaveMemoryItem()} disabled={savingMemoryItem}>
                <Save className="mr-2 h-4 w-4" />
                {savingMemoryItem ? '保存中' : editingMemoryId ? '保存修改' : '添加记忆'}
              </Button>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-3">
            {projectMemoryItems.length > 0 ? (
              projectMemoryItems.map((item) => (
                <div key={item.id} className="rounded-md border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant="secondary">P{item.priority}</Badge>
                        <h3 className="text-sm font-medium text-[var(--moge-text-main)]">
                          {item.title}
                        </h3>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--moge-text-sub)]">
                        {item.content}
                      </p>
                      <p className="mt-2 text-xs text-[var(--moge-text-muted)]">
                        更新于 {dayjs(item.updatedAt).fromNow()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMemoryItem(item)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑
                      </Button>
                      <MogeConfirmPopover
                        trigger={
                          <Button variant="outline" size="sm">
                            <Trash2 className="mr-1 h-4 w-4" />
                            删除
                          </Button>
                        }
                        title="删除项目记忆"
                        description="删除后不会再进入 AI 上下文。"
                        confirmText="删除"
                        loadingText="删除中..."
                        onConfirm={() => handleDeleteMemoryItem(item.id)}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded border border-dashed px-3 py-10 text-center text-sm text-[var(--moge-text-muted)]">
                暂无项目记忆
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card
        className="mb-6 border p-6"
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
        }}
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[var(--moge-primary)]" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--moge-text-main)]">项目资料</h2>
              <p className="text-sm text-[var(--moge-text-sub)]">
                长资料会写入轻量切片，后续用于项目知识检索和 AI 上下文
              </p>
            </div>
          </div>
          <Badge variant="secondary">共 {knowledgeDocuments.length} 份</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="space-y-3 rounded-md border p-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>资料类型</Label>
                <Input
                  value={knowledgeDocumentForm.documentType}
                  onChange={(event) =>
                    updateKnowledgeDocumentFormField('documentType', event.target.value)
                  }
                  placeholder="NOTE"
                />
              </div>
              <div className="space-y-2">
                <Label>来源</Label>
                <Input
                  value={knowledgeDocumentForm.source}
                  onChange={(event) =>
                    updateKnowledgeDocumentFormField('source', event.target.value)
                  }
                  placeholder="MANUAL"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={knowledgeDocumentForm.title}
                onChange={(event) => updateKnowledgeDocumentFormField('title', event.target.value)}
                placeholder="门派制度"
              />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                value={knowledgeDocumentForm.content}
                onChange={(event) =>
                  updateKnowledgeDocumentFormField('content', event.target.value)
                }
                placeholder="整理项目资料、世界规则、人物关系或风格说明..."
                rows={8}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editingKnowledgeDocumentId && (
                <Button variant="outline" onClick={resetKnowledgeDocumentForm}>
                  取消编辑
                </Button>
              )}
              <Button
                onClick={() => void handleSaveKnowledgeDocument()}
                disabled={savingKnowledgeDocument}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingKnowledgeDocument
                  ? '保存中'
                  : editingKnowledgeDocumentId
                    ? '保存修改'
                    : '添加资料'}
              </Button>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-3">
            {knowledgeDocuments.length > 0 ? (
              knowledgeDocuments.map((document) => (
                <div key={document.id} className="rounded-md border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{document.documentType}</Badge>
                        <Badge variant="secondary">{document.source}</Badge>
                        <h3 className="text-sm font-medium text-[var(--moge-text-main)]">
                          {document.title}
                        </h3>
                      </div>
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[var(--moge-text-sub)]">
                        {document.content}
                      </p>
                      <p className="mt-2 text-xs text-[var(--moge-text-muted)]">
                        更新于 {dayjs(document.updatedAt).fromNow()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditKnowledgeDocument(document)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑
                      </Button>
                      <MogeConfirmPopover
                        trigger={
                          <Button variant="outline" size="sm">
                            <Trash2 className="mr-1 h-4 w-4" />
                            删除
                          </Button>
                        }
                        title="删除项目资料"
                        description="删除后会同时移除该资料的知识切片。"
                        confirmText="删除"
                        loadingText="删除中..."
                        onConfirm={() => handleDeleteKnowledgeDocument(document.id)}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded border border-dashed px-3 py-10 text-center text-sm text-[var(--moge-text-muted)]">
                暂无项目资料
              </p>
            )}
          </div>
        </div>
      </Card>

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
