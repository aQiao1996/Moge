/**
 * 文稿章节编辑页
 *
 * 功能：
 * - 编辑章节内容（Markdown 格式）
 * - 自动保存（30秒或内容变更）
 * - 实时字数统计
 * - 左侧卷章树导航
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Clock, Sparkles, Eye, EyeOff, History, NotebookText } from 'lucide-react';
import { toast } from 'sonner';
import EnhancedMdEditor from '@/app/components/EnhancedMdEditor';
import ManuscriptEditSidebar from '../../components/ManuscriptEditSidebar';
import AIAssistPanel from '../../components/AIAssistPanel';
import ChapterVersionHistory from '@/components/ChapterVersionHistory';
import {
  getManuscript,
  getChapterContent,
  getChapterSummary,
  createChapterSummaryJob,
  saveChapterContent,
  saveChapterSummary,
  publishChapter,
  scheduleChapterPublish,
  cancelChapterSchedule,
  unpublishChapter,
  type Manuscript,
  type ManuscriptChapter,
} from '../../api/client';
import dayjs from '@/lib/dayjs';

export default function ManuscriptEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const chapterId = searchParams.get('chapter');

  // 数据状态
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAIPanelOpen, setAIPanelOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [chapterSummary, setChapterSummary] = useState('');
  const [savedChapterSummary, setSavedChapterSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summarySaving, setSummarySaving] = useState(false);
  const [summaryJobCreating, setSummaryJobCreating] = useState(false);

  // 自动保存定时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);
  const savedContentRef = useRef(content); // 记录已保存的内容

  /**
   * 计算字数
   */
  const calculateWordCount = useCallback((text: string) => {
    // 移除 Markdown 标记和空白字符后计算字数
    const cleanText = text
      .replace(/[#*_`~[\]()]/g, '') // 移除 Markdown 符号
      .replace(/\s+/g, ''); // 移除空白字符
    return cleanText.length;
  }, []);

  /**
   * 加载文稿数据
   */
  const loadManuscript = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getManuscript(Number(id));
      setManuscript(response.data);
    } catch (error) {
      console.error('Load manuscript error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * 加载章节内容
   */
  const loadChapterContent = useCallback(async () => {
    if (!chapterId) return;

    try {
      const response = await getChapterContent(Number(chapterId));
      const loadedContent = response.data?.content || '';
      savedContentRef.current = loadedContent; // 记录已保存的内容
      contentRef.current = loadedContent;
      setContent(loadedContent);
      setWordCount(calculateWordCount(loadedContent));
      setHasUnsavedChanges(false);
      setLastSaved(response.data?.updatedAt ? new Date(response.data.updatedAt) : null);

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    } catch (error) {
      console.error('Load chapter content error:', error);
    }
  }, [calculateWordCount, chapterId]);

  /**
   * 加载章节摘要
   */
  const loadChapterSummary = useCallback(async () => {
    if (!chapterId) return;

    try {
      setSummaryLoading(true);
      const response = await getChapterSummary(Number(chapterId));
      const summary = response.data?.summary ?? '';
      setChapterSummary(summary);
      setSavedChapterSummary(summary);
    } catch (error) {
      console.error('Load chapter summary error:', error);
      setChapterSummary('');
      setSavedChapterSummary('');
    } finally {
      setSummaryLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    void loadManuscript();
  }, [loadManuscript]);

  useEffect(() => {
    if (chapterId) {
      void loadChapterContent();
      void loadChapterSummary();
    }
  }, [chapterId, loadChapterContent, loadChapterSummary]);

  /**
   * 保存章节内容
   */
  const handleSave = useCallback(
    async (showToast = true) => {
      if (!chapterId || saving) return;

      // 如果内容没有变化，不需要保存
      if (contentRef.current === savedContentRef.current) {
        return;
      }

      try {
        setSaving(true);
        await saveChapterContent(Number(chapterId), { content: contentRef.current });
        savedContentRef.current = contentRef.current;
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        if (showToast) {
          toast.success('保存成功');
        }
      } catch (error) {
        console.error('Save error:', error);
      } finally {
        setSaving(false);
      }
    },
    [chapterId, saving]
  );

  /**
   * 保存章节摘要
   */
  const handleSaveChapterSummary = useCallback(async () => {
    if (!chapterId || summarySaving) return;

    const summary = chapterSummary.trim();
    if (!summary) {
      toast.error('章节摘要不能为空');
      return;
    }

    try {
      setSummarySaving(true);
      const response = await saveChapterSummary(Number(chapterId), { summary });
      const savedSummary = response.data.summary ?? '';
      setChapterSummary(savedSummary);
      setSavedChapterSummary(savedSummary);
      toast.success('摘要已保存');
    } catch (error) {
      console.error('Save chapter summary error:', error);
      toast.error(error instanceof Error ? error.message : '摘要保存失败');
    } finally {
      setSummarySaving(false);
    }
  }, [chapterId, chapterSummary, summarySaving]);

  /**
   * 创建章节摘要 AI 任务
   */
  const handleCreateChapterSummaryJob = useCallback(async () => {
    if (!chapterId || summaryJobCreating) return;

    try {
      setSummaryJobCreating(true);
      const response = await createChapterSummaryJob(Number(chapterId));
      toast.success(`摘要生成任务已创建 #${response.data.id}`);
    } catch (error) {
      console.error('Create chapter summary job error:', error);
    } finally {
      setSummaryJobCreating(false);
    }
  }, [chapterId, summaryJobCreating]);

  const applyContentUpdate = useCallback(
    (newContent: string) => {
      setContent(newContent);
      contentRef.current = newContent;
      setWordCount(calculateWordCount(newContent));

      const contentChanged = newContent !== savedContentRef.current;
      setHasUnsavedChanges(contentChanged);

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      if (contentChanged) {
        autoSaveTimerRef.current = setTimeout(() => {
          void handleSave(false); // 自动保存不显示toast
        }, 30000);
      } else {
        autoSaveTimerRef.current = null;
      }
    },
    [calculateWordCount, handleSave]
  );

  /**
   * 处理内容变更
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      applyContentUpdate(newContent);
    },
    [applyContentUpdate]
  );

  /**
   * 组件卸载时清理定时器
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  /**
   * 离开页面确认（当有未保存更改时）
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        return '您有未保存的更改，确定要离开吗？';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleBack = () => {
    router.push(`/manuscripts/${id}`);
  };

  /**
   * 处理 AI 续写
   */
  const handleAIContinue = (generatedText: string) => {
    applyContentUpdate(contentRef.current + '\n\n' + generatedText);
  };

  /**
   * 处理 AI 润色
   */
  const handleAIPolish = (polishedText: string) => {
    // 如果有选中的文本，替换选中部分；否则替换全部内容
    if (selectedText) {
      applyContentUpdate(contentRef.current.replace(selectedText, polishedText));
      setSelectedText('');
    } else {
      applyContentUpdate(polishedText);
    }
  };

  /**
   * 处理 AI 扩写
   */
  const handleAIExpand = (expandedText: string) => {
    // 如果有选中的文本，替换选中部分；否则追加到末尾
    if (selectedText) {
      applyContentUpdate(contentRef.current.replace(selectedText, expandedText));
      setSelectedText('');
    } else {
      applyContentUpdate(contentRef.current + '\n\n' + expandedText);
    }
  };

  /**
   * 处理切换章节（先保存当前内容）
   */
  const handleSelectChapter = async (newChapterId: string) => {
    // 如果有未保存的更改，先保存
    if (hasUnsavedChanges) {
      try {
        await handleSave(false); // 静默保存
        toast.success('已自动保存当前章节');
      } catch (error) {
        console.error('Auto save before switch error:', error);
        // 即使保存失败也允许切换，让用户决定
        if (
          !window.confirm('当前章节保存失败，是否仍要切换到其他章节？\n未保存的内容可能会丢失。')
        ) {
          return;
        }
      }
    }

    router.push(`/manuscripts/${id}/edit?chapter=${newChapterId}`);
  };

  /**
   * 处理发布章节
   */
  const handlePublish = async () => {
    if (!chapterId) return;

    try {
      await publishChapter(Number(chapterId));
      toast.success('章节已发布');
      void loadManuscript(); // 刷新数据
    } catch (error) {
      console.error('Publish chapter error:', error);
    }
  };

  /**
   * 处理定时发布章节
   */
  const handleSchedulePublish = async () => {
    if (!chapterId || !scheduledAt) return;

    try {
      await scheduleChapterPublish(Number(chapterId), new Date(scheduledAt).toISOString());
      toast.success('已设置定时发布');
      setScheduledAt('');
      void loadManuscript();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '定时发布失败');
      console.error('Schedule publish error:', error);
    }
  };

  /**
   * 处理取消定时发布章节
   */
  const handleCancelSchedule = async () => {
    if (!chapterId) return;

    try {
      await cancelChapterSchedule(Number(chapterId));
      toast.success('已取消定时发布');
      void loadManuscript();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消定时发布失败');
      console.error('Cancel schedule error:', error);
    }
  };

  /**
   * 处理取消发布章节
   */
  const handleUnpublish = async () => {
    if (!chapterId) return;

    try {
      await unpublishChapter(Number(chapterId));
      toast.success('已取消发布');
      void loadManuscript(); // 刷新数据
    } catch (error) {
      console.error('Unpublish chapter error:', error);
    }
  };

  const getCurrentChapter = (): ManuscriptChapter | null => {
    if (!manuscript || !chapterId) return null;

    // 在所有章节中查找
    const allChapters = [
      ...(manuscript.chapters || []),
      ...(manuscript.volumes?.flatMap((v) => v.chapters || []) || []),
    ];

    return allChapters.find((ch) => ch.id?.toString() === chapterId) ?? null;
  };

  const currentChapter = getCurrentChapter();

  // 加载状态
  if (loading) {
    return (
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-md bg-[var(--moge-input-bg)]" />
          <div className="h-96 rounded-md bg-[var(--moge-input-bg)]" />
        </div>
      </div>
    );
  }

  // 数据不存在
  if (!manuscript) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Card className="p-10 text-center">
          <p className="text-[var(--moge-text-sub)]">文稿不存在</p>
          <Button onClick={handleBack} className="mt-4">
            返回详情
          </Button>
        </Card>
      </div>
    );
  }

  // 未选择章节
  if (!chapterId || !currentChapter) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Card className="p-10 text-center">
          <p className="text-[var(--moge-text-sub)]">请从左侧选择要编辑的章节</p>
          <Button onClick={handleBack} className="mt-4">
            返回详情
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col p-6">
      {/* 头部 */}
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--moge-text-main)]">
              {currentChapter.title}
            </h1>
            <p className="text-sm text-[var(--moge-text-sub)]">{manuscript.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* 字数统计 */}
          <div className="text-sm text-[var(--moge-text-sub)]">
            <span className="font-medium text-[var(--moge-text-main)]">{wordCount}</span> 字
          </div>

          {/* 保存状态提示 */}
          <div className="flex items-center gap-2 text-sm">
            {saving ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span className="text-blue-600">保存中...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-yellow-600">未保存</span>
              </>
            ) : lastSaved ? (
              <>
                <Clock className="h-4 w-4 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-muted)]">
                  已保存: {dayjs(lastSaved).fromNow()}
                </span>
              </>
            ) : null}
          </div>

          {/* AI 辅助按钮 */}
          <Button variant="outline" onClick={() => setAIPanelOpen(!isAIPanelOpen)}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isAIPanelOpen ? '隐藏 AI' : 'AI 辅助'}
          </Button>

          <Button variant="outline" onClick={() => setVersionHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            版本历史
          </Button>

          {/* 发布/定时发布/取消发布按钮 */}
          {currentChapter.status === 'PUBLISHED' ? (
            <Button variant="outline" onClick={() => void handleUnpublish()}>
              <EyeOff className="mr-2 h-4 w-4" />
              取消发布
            </Button>
          ) : currentChapter.status === 'SCHEDULED' ? (
            <Button variant="outline" onClick={() => void handleCancelSchedule()}>
              <Clock className="mr-2 h-4 w-4" />
              取消定时
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="w-44"
              />
              <Button variant="outline" onClick={() => void handleSchedulePublish()}>
                <Clock className="mr-2 h-4 w-4" />
                定时
              </Button>
              <Button variant="outline" onClick={() => void handlePublish()}>
                <Eye className="mr-2 h-4 w-4" />
                发布章节
              </Button>
            </div>
          )}

          {/* 保存按钮 */}
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-1 gap-6 overflow-auto lg:flex-row">
        {/* 左侧侧边栏 */}
        <ManuscriptEditSidebar
          manuscript={manuscript}
          currentChapterId={chapterId}
          onSelectChapter={(chapterId) => void handleSelectChapter(chapterId)}
          isOpen={isSidebarOpen}
          onToggle={() => setSidebarOpen(!isSidebarOpen)}
        />

        {/* 右侧编辑器区域 */}
        <div className="flex flex-1 gap-6">
          {/* 编辑器 */}
          <Card className="flex min-h-[600px] flex-1 flex-col p-6">
            <EnhancedMdEditor
              value={content}
              onChange={handleContentChange}
              onTextSelect={setSelectedText}
              placeholder="开始创作你的章节内容..."
              height={500}
              projectId={manuscript.projectId || undefined}
            />
          </Card>

          {/* AI 辅助面板 */}
          {isAIPanelOpen && (
            <div className="flex w-96 flex-shrink-0 flex-col gap-4">
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <NotebookText className="h-4 w-4 flex-shrink-0 text-[var(--moge-primary)]" />
                    <div className="min-w-0">
                      <h2 className="text-sm font-medium text-[var(--moge-text-main)]">章节摘要</h2>
                      <p className="text-xs text-[var(--moge-text-muted)]">
                        {summaryLoading
                          ? '加载中'
                          : chapterSummary === savedChapterSummary
                            ? '已同步到 AI 上下文'
                            : '有未保存修改'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleCreateChapterSummaryJob()}
                      disabled={summaryJobCreating || summaryLoading || !content.trim()}
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      {summaryJobCreating ? '创建中' : 'AI生成'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSaveChapterSummary()}
                      disabled={
                        summarySaving || summaryLoading || chapterSummary === savedChapterSummary
                      }
                    >
                      {summarySaving ? '保存中' : '保存'}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={chapterSummary}
                  onChange={(event) => setChapterSummary(event.target.value)}
                  placeholder="记录本章关键事件、人物状态和伏笔变化..."
                  className="min-h-28 resize-none"
                  disabled={summaryLoading}
                />
              </Card>
              <AIAssistPanel
                chapterId={Number(chapterId)}
                manuscriptId={Number(id)}
                projectId={manuscript.projectId ?? undefined}
                content={content}
                selectedText={selectedText}
                onContinue={handleAIContinue}
                onPolish={handleAIPolish}
                onExpand={handleAIExpand}
              />
            </div>
          )}
        </div>
      </div>

      <ChapterVersionHistory
        chapterId={Number(chapterId)}
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        onVersionRestored={() => {
          void loadChapterContent();
          void loadManuscript();
        }}
      />
    </div>
  );
}
