'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Eye, Loader2, RefreshCcw, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cancelAiJob, getAiJobs, retryAiJob, type WorkspaceAiJob } from '@/api/workspace.api';
import dayjs from '@/lib/dayjs';
import type { AiJobStatus, AiTaskType } from '@moge/types';

type CompleteAiJob = WorkspaceAiJob & {
  id: number;
  taskType: AiTaskType;
  status: AiJobStatus;
};

const AI_TASK_LABELS: Record<AiTaskType, string> = {
  OUTLINE_GENERATE: '大纲生成',
  MANUSCRIPT_CONTINUE: '续写',
  MANUSCRIPT_POLISH: '润色',
  MANUSCRIPT_EXPAND: '扩写',
  CHAPTER_SUMMARIZE: '章节摘要',
};

const AI_JOB_STATUS_OPTIONS: Array<{ value: AiJobStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部状态' },
  { value: 'PENDING', label: '待入队' },
  { value: 'QUEUED', label: '排队中' },
  { value: 'RUNNING', label: '运行中' },
  { value: 'SUCCESS', label: '已完成' },
  { value: 'FAILED', label: '失败' },
  { value: 'CANCELED', label: '已取消' },
  { value: 'PARTIAL_SUCCESS', label: '部分完成' },
];

const AI_JOB_STATUS_CONFIG: Record<AiJobStatus, { label: string; className: string }> = {
  PENDING: { label: '待入队', className: 'bg-gray-100 text-gray-600' },
  QUEUED: { label: '排队中', className: 'bg-blue-100 text-blue-600' },
  RUNNING: { label: '运行中', className: 'bg-amber-100 text-amber-700' },
  SUCCESS: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  FAILED: { label: '失败', className: 'bg-red-100 text-red-700' },
  CANCELED: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
  PARTIAL_SUCCESS: { label: '部分完成', className: 'bg-cyan-100 text-cyan-700' },
};

function getAiTaskLabel(taskType: AiTaskType) {
  return AI_TASK_LABELS[taskType];
}

function StatusBadge({ status }: { status: AiJobStatus }) {
  const config = AI_JOB_STATUS_CONFIG[status];

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function canCancelAiJob(status: AiJobStatus) {
  return status === 'PENDING' || status === 'QUEUED' || status === 'RUNNING';
}

function canRetryAiJob(status: AiJobStatus) {
  return status === 'FAILED' || status === 'CANCELED';
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function isCompleteAiJob(job: WorkspaceAiJob): job is CompleteAiJob {
  return (
    typeof job.id === 'number' &&
    job.taskType !== undefined &&
    job.status !== undefined &&
    typeof job.priority === 'number' &&
    typeof job.retryCount === 'number' &&
    typeof job.maxRetries === 'number'
  );
}

function formatRelation(job: CompleteAiJob) {
  const parts = [
    job.projectId ? `项目 #${job.projectId}` : null,
    job.outlineId ? `大纲 #${job.outlineId}` : null,
    job.manuscriptId ? `文稿 #${job.manuscriptId}` : null,
    job.chapterId ? `章节 #${job.chapterId}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : '未关联对象';
}

export default function AiJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<CompleteAiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AiJobStatus | 'ALL'>('ALL');
  const [actingJobId, setActingJobId] = useState<number | null>(null);

  const selectedStatus = useMemo(
    () => (statusFilter === 'ALL' ? undefined : statusFilter),
    [statusFilter]
  );

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAiJobs({ status: selectedStatus, limit: 50 });
      setJobs(data.filter(isCompleteAiJob));
    } catch (error) {
      console.error('加载 AI 任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const cancelJob = async (jobId: number) => {
    try {
      setActingJobId(jobId);
      const canceled = await cancelAiJob(jobId);
      if (isCompleteAiJob(canceled)) {
        setJobs((current) => current.map((job) => (job.id === canceled.id ? canceled : job)));
      }
      toast.success('AI 任务已取消');
    } catch (error) {
      console.error('取消 AI 任务失败:', error);
    } finally {
      setActingJobId(null);
    }
  };

  const retryJob = async (jobId: number) => {
    try {
      setActingJobId(jobId);
      const retried = await retryAiJob(jobId);
      if (isCompleteAiJob(retried)) {
        setJobs((current) => current.map((job) => (job.id === retried.id ? retried : job)));
      }
      toast.success('AI 任务已重新入队');
    } catch (error) {
      console.error('重试 AI 任务失败:', error);
    } finally {
      setActingJobId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workspace')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Bot className="h-7 w-7 text-[var(--moge-primary)]" />
              <h1 className="text-2xl font-bold text-[var(--moge-text-main)]">AI 任务中心</h1>
            </div>
            <p className="mt-2 text-sm text-[var(--moge-text-sub)]">查看、取消和重试后台 AI 任务</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value: AiJobStatus | 'ALL') => setStatusFilter(value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_JOB_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void loadJobs()} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            刷新
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : jobs.length ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--moge-text-main)]">
                      {getAiTaskLabel(job.taskType)}
                    </span>
                    <StatusBadge status={job.status} />
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      P{job.priority}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[var(--moge-text-sub)]">
                    {formatRelation(job)}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--moge-text-muted)]">
                    <span>创建 {formatDate(job.createdAt)}</span>
                    <span>开始 {formatDate(job.startedAt)}</span>
                    <span>结束 {formatDate(job.finishedAt)}</span>
                    <span>
                      重试 {job.retryCount} / {job.maxRetries}
                    </span>
                  </div>
                  {job.errorMessage && (
                    <p className="line-clamp-2 text-xs text-red-600">{job.errorMessage}</p>
                  )}
                </div>

                <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/workspace/ai-jobs/${job.id}`)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    详情
                  </Button>
                  {canRetryAiJob(job.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void retryJob(job.id)}
                      disabled={actingJobId === job.id}
                    >
                      {actingJobId === job.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-1 h-4 w-4" />
                      )}
                      重试
                    </Button>
                  )}
                  {canCancelAiJob(job.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void cancelJob(job.id)}
                      disabled={actingJobId === job.id}
                    >
                      {actingJobId === job.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-4 w-4" />
                      )}
                      取消
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <p className="text-sm text-[var(--moge-text-muted)]">暂无 AI 任务</p>
        </Card>
      )}
    </div>
  );
}
