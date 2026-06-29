'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  BookOpen,
  FolderOpen,
  TrendingUp,
  Calendar,
  PenTool,
  ArrowRight,
  Eye,
  LayoutDashboard,
  CheckCircle2,
  Lightbulb,
  Plus,
  Trash2,
  Bot,
  Clock,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  cancelAiJob,
  createWorkspaceIdea,
  createWorkspaceTodo,
  deleteWorkspaceIdea,
  deleteWorkspaceTodo,
  getAiJobs,
  getWorkspaceItems,
  getWorkspaceSummary,
  retryAiJob,
  updateWorkspaceTodo,
  type WorkspaceAiJob,
  type WorkspaceIdea,
  type WorkspaceSummary,
  type WorkspaceTodo,
} from '@/api/workspace.api';
import { useDictStore } from '@/stores/dictStore';
import { getDictLabel } from '@/app/(main)/outline/utils/dictUtils';
import dayjs from '@/lib/dayjs';
import MogePageHeader from '@/app/components/MogePageHeader';
import { toast } from 'sonner';

const TODO_STORAGE_KEY = 'moge-workspace-todos';
const IDEA_STORAGE_KEY = 'moge-workspace-ideas';

function readWorkspaceStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function WorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);
  const [todos, setTodos] = useState<WorkspaceTodo[]>([]);
  const [ideas, setIdeas] = useState<WorkspaceIdea[]>([]);
  const [todoText, setTodoText] = useState('');
  const [ideaText, setIdeaText] = useState('');
  const [aiJobs, setAiJobs] = useState<WorkspaceAiJob[]>([]);
  const [cancelingJobId, setCancelingJobId] = useState<number | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<number | null>(null);
  const { novelTypes, fetchNovelTypes } = useDictStore();

  // 加载字典数据
  useEffect(() => {
    void fetchNovelTypes();
  }, [fetchNovelTypes]);

  useEffect(() => {
    void loadWorkspaceSummary();
    void loadWorkspaceItems();
    void loadAiJobs();
  }, []);

  const loadWorkspaceSummary = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceSummary();
      setSummary(data);
    } catch (error) {
      console.error('加载工作台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceItems = async () => {
    try {
      const data = await getWorkspaceItems();
      let nextTodos = data.todos;
      let nextIdeas = data.ideas;

      const localTodos = readWorkspaceStorage<WorkspaceTodo[]>(TODO_STORAGE_KEY, []);
      const localIdeas = readWorkspaceStorage<WorkspaceIdea[]>(IDEA_STORAGE_KEY, []);

      if (nextTodos.length === 0 && localTodos.length > 0) {
        for (const todo of localTodos.slice().reverse()) {
          const created = await createWorkspaceTodo(todo.text);
          if (todo.done) {
            const updated = await updateWorkspaceTodo(created.id, true);
            nextTodos = updated.todos;
          } else {
            nextTodos = [created, ...nextTodos];
          }
        }
        window.localStorage.removeItem(TODO_STORAGE_KEY);
      }

      if (nextIdeas.length === 0 && localIdeas.length > 0) {
        for (const idea of localIdeas.slice().reverse()) {
          const created = await createWorkspaceIdea(idea.content);
          nextIdeas = [created, ...nextIdeas];
        }
        window.localStorage.removeItem(IDEA_STORAGE_KEY);
      }

      setTodos(nextTodos);
      setIdeas(nextIdeas);
    } catch (error) {
      console.error('加载工作台待办和灵感失败:', error);
    }
  };

  const loadAiJobs = async () => {
    try {
      const jobs = await getAiJobs({ limit: 5 });
      setAiJobs(jobs);
    } catch (error) {
      console.error('加载 AI 任务失败:', error);
    }
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  const formatLatency = (latencyMs: number | null | undefined) => {
    if (latencyMs === null || latencyMs === undefined) {
      return '-';
    }

    return latencyMs >= 1000 ? `${(latencyMs / 1000).toFixed(1)}s` : `${latencyMs}ms`;
  };

  const getAiTaskLabel = (taskType: string) => {
    const taskMap: Record<string, string> = {
      MANUSCRIPT_CONTINUE: '续写',
      MANUSCRIPT_POLISH: '润色',
      MANUSCRIPT_EXPAND: '扩写',
      CHAPTER_SUMMARIZE: '章节摘要',
    };

    return taskMap[taskType] ?? taskType;
  };

  const getAiJobStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: '待入队', className: 'bg-gray-100 text-gray-600' },
      QUEUED: { label: '排队中', className: 'bg-blue-100 text-blue-600' },
      RUNNING: { label: '运行中', className: 'bg-amber-100 text-amber-700' },
      SUCCESS: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
      FAILED: { label: '失败', className: 'bg-red-100 text-red-700' },
      CANCELED: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
      PARTIAL_SUCCESS: { label: '部分完成', className: 'bg-cyan-100 text-cyan-700' },
    };
    const config = statusMap[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };

    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const canCancelAiJob = (status: string) => {
    return status === 'PENDING' || status === 'QUEUED' || status === 'RUNNING';
  };

  const canRetryAiJob = (status: string) => {
    return status === 'FAILED' || status === 'CANCELED';
  };

  const cancelJob = async (jobId: number) => {
    try {
      setCancelingJobId(jobId);
      const canceled = await cancelAiJob(jobId);
      setAiJobs((jobs) => jobs.map((job) => (job.id === canceled.id ? canceled : job)));
      toast.success('AI 任务已取消');
    } catch (error) {
      console.error('取消 AI 任务失败:', error);
    } finally {
      setCancelingJobId(null);
    }
  };

  const retryJob = async (jobId: number) => {
    try {
      setRetryingJobId(jobId);
      const retried = await retryAiJob(jobId);
      setAiJobs((jobs) => jobs.map((job) => (job.id === retried.id ? retried : job)));
      toast.success('AI 任务已重新入队');
    } catch (error) {
      console.error('重试 AI 任务失败:', error);
    } finally {
      setRetryingJobId(null);
    }
  };

  const addTodo = async () => {
    const text = todoText.trim();
    if (!text) return;

    try {
      const todo = await createWorkspaceTodo(text);
      setTodos((items) => [todo, ...items]);
      setTodoText('');
      toast.success('待办已添加');
    } catch (error) {
      console.error('添加待办失败:', error);
    }
  };

  const toggleTodo = async (todo: WorkspaceTodo) => {
    try {
      const data = await updateWorkspaceTodo(todo.id, !todo.done);
      setTodos(data.todos);
    } catch (error) {
      console.error('更新待办失败:', error);
    }
  };

  const removeTodo = async (id: string) => {
    try {
      const data = await deleteWorkspaceTodo(id);
      setTodos(data.todos);
    } catch (error) {
      console.error('删除待办失败:', error);
    }
  };

  const addIdea = async () => {
    const content = ideaText.trim();
    if (!content) return;

    try {
      const idea = await createWorkspaceIdea(content);
      setIdeas((items) => [idea, ...items]);
      setIdeaText('');
      toast.success('灵感已记录');
    } catch (error) {
      console.error('记录灵感失败:', error);
    }
  };

  const removeIdea = async (id: string) => {
    try {
      const data = await deleteWorkspaceIdea(id);
      setIdeas(data.ideas);
    } catch (error) {
      console.error('删除灵感失败:', error);
    }
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
      IN_PROGRESS: { label: '进行中', className: 'bg-blue-100 text-blue-600' },
      COMPLETED: { label: '已完结', className: 'bg-green-100 text-green-600' },
      PUBLISHED: { label: '已发布', className: 'bg-purple-100 text-purple-600' },
      GENERATING: { label: '生成中', className: 'bg-yellow-100 text-yellow-600' },
      GENERATED: { label: '已生成', className: 'bg-cyan-100 text-cyan-600' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
    return (
      <span
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MogePageHeader
        title="工作台"
        description="查看近期创作概览，快速进入常用工作区"
        icon={LayoutDashboard}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => router.push('/settings')} variant="outline" size="sm">
              <FolderOpen className="mr-1 h-4 w-4" />
              项目列表
            </Button>
            <Button onClick={() => router.push('/outline')} variant="outline" size="sm">
              <BookOpen className="mr-1 h-4 w-4" />
              大纲列表
            </Button>
            <Button onClick={() => router.push('/manuscripts')} size="sm">
              <FileText className="mr-1 h-4 w-4" />
              文稿列表
            </Button>
          </div>
        }
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <PenTool className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">今日字数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {formatNumber(summary?.stats.todayWords || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">本周字数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {formatNumber(summary?.stats.weekWords || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">总字数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {formatNumber(summary?.stats.totalWords || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2">
              <FolderOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">项目数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {summary?.stats.projectCount || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-50 p-2">
              <FileText className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">文稿数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {summary?.stats.manuscriptCount || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              今日待办
            </h3>
            <span className="text-xs text-[var(--moge-text-muted)]">
              {todos.filter((item) => item.done).length}/{todos.length} 完成
            </span>
          </div>
          <div className="mb-4 flex gap-2">
            <Input
              value={todoText}
              onChange={(event) => setTodoText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void addTodo();
                }
              }}
              placeholder="添加今日写作目标"
            />
            <Button size="icon" onClick={() => void addTodo()} aria-label="添加待办">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {todos.length ? (
              todos.slice(0, 6).map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                  style={{ borderColor: 'var(--moge-card-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => void toggleTodo(todo)}
                    className={`h-4 w-4 rounded-full border ${
                      todo.done ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                    }`}
                    aria-label={todo.done ? '标记为未完成' : '标记为已完成'}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      todo.done
                        ? 'text-[var(--moge-text-muted)] line-through'
                        : 'text-[var(--moge-text-main)]'
                    }`}
                  >
                    {todo.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void removeTodo(todo.id)}
                    aria-label="删除待办"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-[var(--moge-text-muted)]">暂无待办</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              灵感便签
            </h3>
            <span className="text-xs text-[var(--moge-text-muted)]">{ideas.length} 条</span>
          </div>
          <div className="mb-4 space-y-2">
            <Textarea
              value={ideaText}
              onChange={(event) => setIdeaText(event.target.value)}
              placeholder="记录一个剧情、角色或设定想法"
              className="min-h-20"
            />
            <Button onClick={() => void addIdea()} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              记录灵感
            </Button>
          </div>
          <div className="space-y-2">
            {ideas.length ? (
              ideas.slice(0, 5).map((idea) => (
                <div
                  key={idea.id}
                  className="rounded-md border p-3"
                  style={{ borderColor: 'var(--moge-card-border)' }}
                >
                  <div className="flex items-start gap-3">
                    <p className="flex-1 whitespace-pre-wrap text-sm text-[var(--moge-text-main)]">
                      {idea.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void removeIdea(idea.id)}
                      aria-label="删除灵感"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-[var(--moge-text-muted)]">
                    {dayjs(idea.createdAt).fromNow()}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-[var(--moge-text-muted)]">暂无灵感便签</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-[var(--moge-primary)]" />
              AI 使用概览
            </h3>
            <p className="mt-1 text-sm text-[var(--moge-text-sub)]">
              最近生成调用、候选采纳和耗时概况
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-[var(--moge-text-muted)]">调用</p>
              <p className="font-semibold text-[var(--moge-text-main)]">
                {summary?.aiUsage.totalCalls ?? 0}
              </p>
            </div>
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-[var(--moge-text-muted)]">失败</p>
              <p className="font-semibold text-[var(--moge-text-main)]">
                {summary?.aiUsage.failedCount ?? 0}
              </p>
            </div>
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-[var(--moge-text-muted)]">采纳</p>
              <p className="font-semibold text-[var(--moge-text-main)]">
                {summary?.aiUsage.appliedCandidateCount ?? 0}
              </p>
            </div>
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-[var(--moge-text-muted)]">均耗时</p>
              <p className="font-semibold text-[var(--moge-text-main)]">
                {formatLatency(summary?.aiUsage.averageLatencyMs)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--moge-text-main)]">
              <Clock className="h-4 w-4 text-[var(--moge-text-muted)]" />
              最近生成记录
            </div>
            {summary?.aiUsage.recentRecords.length ? (
              summary.aiUsage.recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[var(--moge-text-main)]">
                        {getAiTaskLabel(record.taskType)}
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {record.status}
                      </span>
                      <span className="text-xs text-[var(--moge-text-muted)]">
                        {record.provider} · {record.model}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--moge-text-muted)]">
                      {record.projectName || '未关联项目'} · {dayjs(record.createdAt).fromNow()}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--moge-text-sub)]">
                    {formatLatency(record.latencyMs)}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded border border-dashed py-8 text-center text-sm text-[var(--moge-text-muted)]">
                暂无 AI 生成记录
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--moge-text-main)]">
                <Bot className="h-4 w-4 text-[var(--moge-primary)]" />
                最近 AI 任务
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/workspace/ai-jobs')}
                className="text-xs"
              >
                查看全部
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            {aiJobs.length ? (
              aiJobs.map((job) => {
                const jobId = job.id ?? 0;
                const taskType = job.taskType ?? 'UNKNOWN';
                const status = job.status ?? 'UNKNOWN';
                const priority = job.priority ?? 0;
                const createdAt = job.createdAt ?? new Date().toISOString();

                return (
                  <div
                    key={jobId}
                    className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--moge-text-main)]">
                          {getAiTaskLabel(taskType)}
                        </span>
                        {getAiJobStatusBadge(status)}
                        {priority > 0 && (
                          <span className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                            P{priority}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--moge-text-muted)]">
                        {job.projectId ? `项目 #${job.projectId}` : '未关联项目'} ·{' '}
                        {dayjs(createdAt).fromNow()}
                      </p>
                      {job.errorMessage && (
                        <p className="mt-1 line-clamp-1 text-xs text-red-600">{job.errorMessage}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/workspace/ai-jobs/${jobId}`)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        详情
                      </Button>
                      <div className="flex shrink-0 items-center gap-2">
                        {canRetryAiJob(status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void retryJob(jobId)}
                            disabled={retryingJobId === jobId}
                          >
                            {retryingJobId === jobId ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="mr-1 h-4 w-4" />
                            )}
                            重试
                          </Button>
                        )}
                        {canCancelAiJob(status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void cancelJob(jobId)}
                            disabled={cancelingJobId === jobId}
                          >
                            {cancelingJobId === jobId ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-1 h-4 w-4" />
                            )}
                            取消
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded border border-dashed py-8 text-center text-sm text-[var(--moge-text-muted)]">
                暂无 AI 任务
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 最近内容 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 最近项目 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FolderOpen className="h-5 w-5" />
              最近项目
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings')}
              className="text-sm"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {summary?.recentProjects.length ? (
              summary.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/settings/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--moge-text-main)]">{project.name}</h4>
                      <p className="text-sm text-[var(--moge-text-sub)]">{project.type}</p>
                    </div>
                    <span className="text-xs text-[var(--moge-text-muted)]">
                      {dayjs(project.updatedAt).fromNow()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-[var(--moge-text-muted)]">暂无项目</p>
            )}
          </div>
        </Card>

        {/* 最近大纲 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5" />
              最近大纲
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/outline')}
              className="text-sm"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {summary?.recentOutlines.length ? (
              summary.recentOutlines.map((outline) => (
                <div
                  key={outline.id}
                  className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/outline/${outline.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--moge-text-main)]">{outline.name}</h4>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(outline.status)}
                        <span className="text-xs text-[var(--moge-text-sub)]">
                          {getDictLabel(novelTypes, outline.type)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--moge-text-muted)]">
                      {dayjs(outline.updatedAt).fromNow()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-[var(--moge-text-muted)]">暂无大纲</p>
            )}
          </div>
        </Card>

        {/* 最近文稿 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              最近文稿
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/manuscripts')}
              className="text-sm"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {summary?.recentManuscripts.length ? (
              summary.recentManuscripts.map((manuscript) => (
                <div
                  key={manuscript.id}
                  className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  onClick={() => {
                    if (manuscript.lastEditedChapterId) {
                      router.push(
                        `/manuscripts/${manuscript.id}/edit?chapter=${manuscript.lastEditedChapterId}`
                      );
                    } else {
                      router.push(`/manuscripts/${manuscript.id}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--moge-text-main)]">
                        {manuscript.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(manuscript.status)}
                        <span className="text-xs text-[var(--moge-text-sub)]">
                          {formatNumber(manuscript.totalWords)} 字
                        </span>
                      </div>
                    </div>
                    {manuscript.lastEditedAt && (
                      <span className="text-xs text-[var(--moge-text-muted)]">
                        {dayjs(manuscript.lastEditedAt).fromNow()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-[var(--moge-text-muted)]">暂无文稿</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
