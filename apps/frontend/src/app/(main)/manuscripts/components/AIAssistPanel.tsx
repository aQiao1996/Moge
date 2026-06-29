/**
 * AI 辅助面板组件
 *
 * 功能:
 * - AI 续写章节内容
 * - AI 润色文字
 * - AI 扩写内容
 * - 显示 AI 生成进度
 */
'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wand2, Sparkles, Expand, Loader2, Database, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import type {
  AiCandidateApplyMode,
  AiGenerationResponse,
  AiPromptPreset,
  AiTaskOverrideConfig,
  AiTaskType,
} from '@moge/types';
import { getProjectPromptPresets, type ProjectAiConfig } from '@/api/projects.api';
import {
  aiContinueChapter,
  aiPolishText,
  aiExpandText,
  applyAiCandidate,
  discardAiCandidate,
  getManuscriptSettings,
  type ManuscriptSettingsDetail,
} from '../api/client';

export interface AIAssistPanelProps {
  /**
   * 当前章节 ID
   */
  chapterId: number;
  /**
   * 当前文稿 ID
   */
  manuscriptId: number;
  /**
   * 当前项目 ID，用于加载项目 Prompt 预设
   */
  projectId?: number;
  /**
   * 当前章节内容
   */
  content: string;
  /**
   * 选中的文本
   */
  selectedText?: string;
  /**
   * AI 续写回调
   */
  onContinue?: (generatedText: string) => void;
  /**
   * AI 润色回调
   */
  onPolish?: (polishedText: string) => void;
  /**
   * AI 扩写回调
   */
  onExpand?: (expandedText: string) => void;
}

type ManuscriptAiTab = 'continue' | 'polish' | 'expand';
type OverrideForm = {
  provider: ProjectAiConfig['provider'] | 'inherit';
  model: string;
  temperature: string;
  maxTokens: string;
  contextLengthStrategy: ProjectAiConfig['contextLengthStrategy'] | 'inherit';
  defaultPresetId: string;
};

const defaultOverrideForm: OverrideForm = {
  provider: 'inherit',
  model: '',
  temperature: '',
  maxTokens: '',
  contextLengthStrategy: 'inherit',
  defaultPresetId: 'inherit',
};

const aiProviderOptions: Array<{ value: ProjectAiConfig['provider']; label: string }> = [
  { value: 'openai_compatible', label: 'OpenAI 兼容' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'moonshot', label: 'Moonshot' },
  { value: 'gemini', label: 'Gemini' },
];

const contextStrategyOptions: Array<{
  value: ProjectAiConfig['contextLengthStrategy'];
  label: string;
}> = [
  { value: 'COMPACT', label: '紧凑' },
  { value: 'BALANCED', label: '均衡' },
  { value: 'EXPANDED', label: '扩展' },
];

const tabTaskTypeMap: Record<ManuscriptAiTab, AiTaskType> = {
  continue: 'MANUSCRIPT_CONTINUE',
  polish: 'MANUSCRIPT_POLISH',
  expand: 'MANUSCRIPT_EXPAND',
};

function buildOverrideConfig(form: OverrideForm): AiTaskOverrideConfig | undefined {
  const overrideConfig: AiTaskOverrideConfig = {};
  const model = form.model.trim();

  if (form.provider !== 'inherit') {
    overrideConfig.provider = form.provider;
  }

  if (model) {
    overrideConfig.model = model;
  }

  if (form.temperature.trim()) {
    overrideConfig.temperature = Number(form.temperature);
  }

  if (form.maxTokens.trim()) {
    overrideConfig.maxTokens = Number(form.maxTokens);
  }

  if (form.contextLengthStrategy !== 'inherit') {
    overrideConfig.contextLengthStrategy = form.contextLengthStrategy;
  }

  if (form.defaultPresetId !== 'inherit') {
    overrideConfig.defaultPresetId = Number(form.defaultPresetId);
  }

  return Object.keys(overrideConfig).length > 0 ? overrideConfig : undefined;
}

function validateOverrideConfig(overrideConfig: AiTaskOverrideConfig | undefined): boolean {
  if (!overrideConfig) {
    return true;
  }

  if (
    overrideConfig.temperature !== undefined &&
    (!Number.isFinite(overrideConfig.temperature) ||
      overrideConfig.temperature < 0 ||
      overrideConfig.temperature > 2)
  ) {
    toast.error('温度需在 0 到 2 之间');
    return false;
  }

  if (
    overrideConfig.maxTokens !== undefined &&
    (!Number.isInteger(overrideConfig.maxTokens) || overrideConfig.maxTokens <= 0)
  ) {
    toast.error('最大 token 必须是大于 0 的整数');
    return false;
  }

  return true;
}

export default function AIAssistPanel({
  chapterId,
  manuscriptId,
  projectId,
  content,
  selectedText,
  onContinue,
  onPolish,
  onExpand,
}: AIAssistPanelProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [candidateResponse, setCandidateResponse] = useState<AiGenerationResponse | null>(null);
  const [settings, setSettings] = useState<ManuscriptSettingsDetail | null>(null);
  const [promptPresets, setPromptPresets] = useState<AiPromptPreset[]>([]);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>(defaultOverrideForm);
  const [activeTab, setActiveTab] = useState<ManuscriptAiTab>('continue');
  const promptInputId = useId();
  const candidate = candidateResponse?.candidate;
  const effectiveConfig = candidateResponse?.effectiveConfig;
  const contextSources = candidateResponse?.contextSources ?? [];
  const generatedText = candidate?.content ?? '';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getManuscriptSettings(manuscriptId);
        setSettings(response.data);
      } catch (error) {
        console.error('加载 AI 上下文失败:', error);
      }
    };

    void loadSettings();
  }, [manuscriptId]);

  useEffect(() => {
    if (!projectId) {
      setPromptPresets([]);
      return;
    }

    const loadPromptPresets = async () => {
      try {
        const presets = await getProjectPromptPresets(projectId);
        setPromptPresets(presets);
      } catch (error) {
        console.error('加载 Prompt 预设失败:', error);
        setPromptPresets([]);
      }
    };

    void loadPromptPresets();
  }, [projectId]);

  useEffect(() => {
    setOverrideForm((current) =>
      current.defaultPresetId === 'inherit' ? current : { ...current, defaultPresetId: 'inherit' }
    );
  }, [activeTab]);

  const contextSummary = useMemo(() => {
    if (!settings) {
      return null;
    }

    return [
      { label: '角色', count: settings.characters.length },
      { label: '系统', count: settings.systems.length },
      { label: '世界', count: settings.worlds.length },
      { label: '辅助', count: settings.misc.length },
    ];
  }, [settings]);

  const promptPresetOptions = useMemo(
    () =>
      promptPresets.filter(
        (preset) => preset.taskType === tabTaskTypeMap[activeTab] && preset.isEnabled
      ),
    [activeTab, promptPresets]
  );

  const activeOverrideCount = useMemo(() => {
    return Object.values(overrideForm).filter((value) => value.trim() && value !== 'inherit')
      .length;
  }, [overrideForm]);

  const updateOverrideFormField = <K extends keyof OverrideForm>(
    key: K,
    value: OverrideForm[K]
  ) => {
    setOverrideForm((current) => ({ ...current, [key]: value }));
  };

  const getValidatedOverrideConfig = () => {
    const overrideConfig = buildOverrideConfig(overrideForm);
    return validateOverrideConfig(overrideConfig) ? overrideConfig : null;
  };

  /**
   * 处理 AI 续写
   */
  const handleContinue = async () => {
    if (!content.trim()) {
      toast.error('请先输入章节内容');
      return;
    }

    setLoading(true);
    setCandidateResponse(null);

    try {
      const overrideConfig = getValidatedOverrideConfig();
      if (overrideConfig === null) {
        return;
      }

      const response = await aiContinueChapter(chapterId, prompt || undefined, overrideConfig);
      setCandidateResponse(response.data);
      toast.success('AI 续写已生成候选');
    } catch (error) {
      console.error('AI 续写失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理 AI 润色
   */
  const handlePolish = async () => {
    const textToPolish = selectedText || content;
    if (!textToPolish.trim()) {
      toast.error('请先选择要润色的文本或输入章节内容');
      return;
    }

    setLoading(true);
    setCandidateResponse(null);

    try {
      const overrideConfig = getValidatedOverrideConfig();
      if (overrideConfig === null) {
        return;
      }

      const response = await aiPolishText(
        chapterId,
        textToPolish,
        prompt || undefined,
        overrideConfig
      );
      setCandidateResponse(response.data);
      toast.success('AI 润色已生成候选');
    } catch (error) {
      console.error('AI 润色失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理 AI 扩写
   */
  const handleExpand = async () => {
    const textToExpand = selectedText || content;
    if (!textToExpand.trim()) {
      toast.error('请先选择要扩写的文本或输入章节内容');
      return;
    }

    setLoading(true);
    setCandidateResponse(null);

    try {
      const overrideConfig = getValidatedOverrideConfig();
      if (overrideConfig === null) {
        return;
      }

      const response = await aiExpandText(
        chapterId,
        textToExpand,
        prompt || undefined,
        overrideConfig
      );
      setCandidateResponse(response.data);
      toast.success('AI 扩写已生成候选');
    } catch (error) {
      console.error('AI 扩写失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 插入生成的文本到编辑器
   */
  const handleInsert = async () => {
    const candidateId = candidate?.id;
    const candidateContent = generatedText;
    if (candidateId === undefined || !candidateContent) return;

    setApplying(true);

    try {
      const hasSelection = Boolean(selectedText?.trim());
      const applyMode: AiCandidateApplyMode =
        activeTab === 'continue'
          ? 'INSERT_TAIL'
          : hasSelection
            ? 'REPLACE_SELECTION'
            : 'OVERWRITE_DRAFT';
      await applyAiCandidate(candidateId, {
        mode: applyMode,
        selectedText: applyMode === 'REPLACE_SELECTION' ? selectedText : undefined,
      });

      switch (activeTab) {
        case 'continue':
          if (onContinue) {
            onContinue(candidateContent);
          }
          break;
        case 'polish':
          if (onPolish) {
            onPolish(candidateContent);
          }
          break;
        case 'expand':
          if (onExpand) {
            onExpand(candidateContent);
          }
          break;
      }

      setCandidateResponse(null);
      toast.success('已采纳到编辑器');
    } catch (error) {
      console.error('采纳 AI 候选失败:', error);
    } finally {
      setApplying(false);
    }
  };

  /**
   * 丢弃当前 AI 候选
   */
  const handleDiscard = async () => {
    const candidateId = candidate?.id;
    if (candidateId === undefined) return;

    setDiscarding(true);

    try {
      await discardAiCandidate(candidateId);
      setCandidateResponse(null);
      toast.success('候选已丢弃');
    } catch (error) {
      console.error('丢弃 AI 候选失败:', error);
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <Card
      className="flex h-full flex-col border p-4 backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--moge-card-bg)',
        borderColor: 'var(--moge-card-border)',
      }}
    >
      {/* 头部标题 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--moge-text-main)]">AI 辅助</h3>
        <p className="text-sm text-[var(--moge-text-muted)]">使用 AI 辅助创作更高效</p>
      </div>

      {contextSummary && (
        <div className="mb-4 rounded-md border border-[var(--moge-card-border)] p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--moge-text-main)]">
            <Database className="h-4 w-4" />
            当前设定上下文
          </div>
          <div className="flex flex-wrap gap-2">
            {contextSummary.map((item) => (
              <Badge key={item.label} variant="secondary" className="text-xs">
                {item.label} {item.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 功能 Tab */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={activeTab === 'continue' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('continue')}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          续写
        </Button>
        <Button
          variant={activeTab === 'polish' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('polish')}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          润色
        </Button>
        <Button
          variant={activeTab === 'expand' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('expand')}
        >
          <Expand className="mr-2 h-4 w-4" />
          扩写
        </Button>
      </div>

      {/* 提示词输入 */}
      <div className="mb-4">
        <label htmlFor={promptInputId} className="mb-2 block text-sm text-[var(--moge-text-sub)]">
          自定义提示词（可选）
        </label>
        <Textarea
          id={promptInputId}
          name={`ai-assist-${activeTab}-prompt`}
          placeholder={
            activeTab === 'continue'
              ? '例如：继续描写主角的内心活动...'
              : activeTab === 'polish'
                ? '例如：使用更优美的语言...'
                : '例如：扩展战斗场面的描写...'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Collapsible open={overrideOpen} onOpenChange={setOverrideOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full justify-between">
            <span className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">本次覆盖</span>
            </span>
            {activeOverrideCount > 0 && (
              <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
                {activeOverrideCount}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3 rounded-md border border-[var(--moge-card-border)] p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-[var(--moge-text-sub)]">供应商</Label>
                <Select
                  value={overrideForm.provider}
                  onValueChange={(value: OverrideForm['provider']) =>
                    updateOverrideFormField('provider', value)
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">继承项目</SelectItem>
                    {aiProviderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[var(--moge-text-sub)]">模型</Label>
                <Input
                  value={overrideForm.model}
                  onChange={(event) => updateOverrideFormField('model', event.target.value)}
                  placeholder="继承项目模型"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[var(--moge-text-sub)]">温度</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.01"
                  value={overrideForm.temperature}
                  onChange={(event) => updateOverrideFormField('temperature', event.target.value)}
                  placeholder="继承"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[var(--moge-text-sub)]">最大 token</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={overrideForm.maxTokens}
                  onChange={(event) => updateOverrideFormField('maxTokens', event.target.value)}
                  placeholder="继承"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[var(--moge-text-sub)]">上下文</Label>
                <Select
                  value={overrideForm.contextLengthStrategy}
                  onValueChange={(value: OverrideForm['contextLengthStrategy']) =>
                    updateOverrideFormField('contextLengthStrategy', value)
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">继承项目</SelectItem>
                    {contextStrategyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {projectId && (
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--moge-text-sub)]">Prompt 预设</Label>
                  <Select
                    value={overrideForm.defaultPresetId}
                    onValueChange={(value) => updateOverrideFormField('defaultPresetId', value)}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">继承项目</SelectItem>
                      {promptPresetOptions.map((preset) => (
                        <SelectItem key={preset.id} value={String(preset.id)}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {activeOverrideCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setOverrideForm(defaultOverrideForm)}
              >
                清除覆盖
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 选中文本提示 */}
      {selectedText && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs">
            已选择 {selectedText.length} 个字符
          </Badge>
        </div>
      )}

      {/* 生成按钮 */}
      <Button
        onClick={() => {
          void (activeTab === 'continue'
            ? handleContinue()
            : activeTab === 'polish'
              ? handlePolish()
              : handleExpand());
        }}
        disabled={loading}
        className="mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            {activeTab === 'continue' && <Wand2 className="mr-2 h-4 w-4" />}
            {activeTab === 'polish' && <Sparkles className="mr-2 h-4 w-4" />}
            {activeTab === 'expand' && <Expand className="mr-2 h-4 w-4" />}
            开始生成
          </>
        )}
      </Button>

      {/* 生成结果 */}
      {generatedText && (
        <div className="flex-1 overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-sm font-medium text-[var(--moge-text-sub)]">AI 候选</span>
              {effectiveConfig && (
                <p className="truncate text-xs text-[var(--moge-text-muted)]">
                  {effectiveConfig.model} · {contextSources.filter((item) => item.included).length}{' '}
                  个上下文来源
                </p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void handleDiscard();
                }}
                disabled={discarding || applying}
              >
                {discarding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                丢弃
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  void handleInsert();
                }}
                disabled={applying || discarding}
              >
                {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                采纳到编辑器
              </Button>
            </div>
          </div>
          <div className="h-full overflow-y-auto rounded-md border border-[var(--moge-card-border)] bg-[var(--moge-input-bg)] p-3">
            <p className="whitespace-pre-wrap text-sm text-[var(--moge-text-main)]">
              {generatedText}
            </p>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!generatedText && !loading && (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-[var(--moge-text-muted)]">
          <p>点击「开始生成」按钮使用 AI 辅助创作</p>
        </div>
      )}
    </Card>
  );
}
