'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Clock, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cancelAiJob, getAiJob, retryAiJob } from '@/api/workspace.api';
import dayjs from '@/lib/dayjs';
import type { AiJob } from '@moge/types';

type CompleteAiJob = AiJob & {
  id: number;
  taskType: NonNullable<AiJob['taskType']>;
  status: NonNullable<AiJob['status']>;
};

const AI_TASK_LABELS: Record<CompleteAiJob['taskType'], string> = {
  OUTLINE_GENERATE: '大纲生成',
  MANUSCRIPT_CONTINUE: '续写',
  MANUSCRIPT_POLISH: '润色',
  MANUSCRIPT_EXPAND: '扩写',
  CHAPTER_SUMMARIZE: '章节摘要',
};

const AI_JOB_STATUS_CONFIG: Record<CompleteAiJob['status'], { label: string; className: string }> =
  {
    PENDING: { label: '待入队', className: 'bg-gray-100 text-gray-600' },
    QUEUED: { label: '排队中', className: 'bg-blue-100 text-blue-600' },
    RUNNING: { label: '运行中', className: 'bg-amber-100 text-amber-700' },
    SUCCESS: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
    FAILED: { label: '失败', className: 'bg-red-100 text-red-700' },
    CANCELED: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
    PARTIAL_SUCCESS: { label: '部分完成', className: 'bg-cyan-100 text-cyan-700' },
  };

function isCompleteAiJob(job: AiJob | null): job is CompleteAiJob {
  return (
    job !== null &&
    typeof job.id === 'number' &&
    job.taskType !== undefined &&
    job.status !== undefined
  );
}

function canCancelAiJob(status: CompleteAiJob['status']) {
  return status === 'PENDING' || status === 'QUEUED' || status === 'RUNNING';
}

function canRetryAiJob(status: CompleteAiJob['status']) {
  return status === 'FAILED' || status === 'CANCELED';
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return '-';
  }

  return JSON.stringify(value, null, 2);
}

function StatusBadge({ status }: { status: CompleteAiJob['status'] }) {
  const config = AI_JOB_STATUS_CONFIG[status];

  return <Badge className={config.className}>{config.label}</Badge>;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-[var(--moge-text-muted)]">{label}</p>
      <div className="mt-1 text-sm font-medium text-[var(--moge-text-main)]">{value}</div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--moge-text-main)]">{title}</h2>
      <pre className="max-h-80 overflow-auto rounded-md bg-[var(--moge-input-bg)] p-3 text-xs leading-5 text-[var(--moge-text-sub)]">
        {formatJson(value)}
      </pre>
    </Card>
  );
}

export default function AiJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const jobId = useMemo(() => {
    const value = Array.isArray(rawId) ? rawId[0] : rawId;
    return Number(value);
  }, [rawId]);
  const [job, setJob] = useState<AiJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadJob = useCallback(async () => {
    if (!Number.isInteger(jobId) || jobId <= 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAiJob(jobId);
      setJob(data);
    } catch (error) {
      console.error('加载 AI 任务详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  const handleCancel = async () => {
    if (!isCompleteAiJob(job)) {
      return;
    }

    try {
      setActing(true);
      const canceled = await cancelAiJob(job.id);
      setJob(canceled);
      toast.success('AI 任务已取消');
    } catch (error) {
      console.error('取消 AI 任务失败:', error);
    } finally {
      setActing(false);
    }
  };

  const handleRetry = async () => {
    if (!isCompleteAiJob(job)) {
      return;
    }

    try {
      setActing(true);
      const retried = await retryAiJob(job.id);
      setJob(retried);
      toast.success('AI 任务已重新入队');
    } catch (error) {
      console.error('重试 AI 任务失败:', error);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isCompleteAiJob(job)) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Card className="p-10 text-center">
          <p className="text-sm text-[var(--moge-text-muted)]">AI 任务不存在</p>
          <Button className="mt-4" onClick={() => router.push('/workspace')}>
            返回工作台
          </Button>
        </Card>
      </div>
    );
  }

  const currentJob = job;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workspace')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Bot className="h-7 w-7 text-[var(--moge-primary)]" />
              <h1 className="text-2xl font-bold text-[var(--moge-text-main)]">
                {AI_TASK_LABELS[currentJob.taskType]}
              </h1>
              <StatusBadge status={currentJob.status} />
            </div>
            <p className="mt-2 text-sm text-[var(--moge-text-sub)]">
              #{currentJob.id} · 创建于 {formatDate(currentJob.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canRetryAiJob(currentJob.status) && (
            <Button variant="outline" onClick={() => void handleRetry()} disabled={acting}>
              {acting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              重试
            </Button>
          )}
          {canCancelAiJob(currentJob.status) && (
            <Button variant="outline" onClick={() => void handleCancel()} disabled={acting}>
              {acting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              取消
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="任务类型" value={AI_TASK_LABELS[currentJob.taskType]} />
        <DetailItem label="优先级" value={`P${currentJob.priority}`} />
        <DetailItem
          label="重试次数"
          value={`${currentJob.retryCount} / ${currentJob.maxRetries}`}
        />
        <DetailItem
          label="供应商"
          value={currentJob.provider ? `${currentJob.provider} · ${currentJob.model ?? '-'}` : '-'}
        />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--moge-text-main)]">关联对象</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <DetailItem label="项目" value={job.projectId ? `#${job.projectId}` : '-'} />
          <DetailItem label="大纲" value={job.outlineId ? `#${job.outlineId}` : '-'} />
          <DetailItem label="文稿" value={job.manuscriptId ? `#${job.manuscriptId}` : '-'} />
          <DetailItem label="章节" value={job.chapterId ? `#${job.chapterId}` : '-'} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--moge-text-main)]">
          <Clock className="h-4 w-4" />
          执行时间
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <DetailItem label="开始时间" value={formatDate(job.startedAt)} />
          <DetailItem label="结束时间" value={formatDate(job.finishedAt)} />
          <DetailItem label="下次重试" value={formatDate(job.nextRetryAt)} />
        </div>
      </Card>

      {job.errorMessage && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {job.errorMessage}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <JsonBlock title="输入参数" value={job.inputPayload} />
        <JsonBlock title="上下文信息" value={job.contextMeta} />
        <JsonBlock title="结果摘要" value={job.resultSummary} />
        <JsonBlock title="事件负载" value={job.events?.at(-1)?.payload} />
      </div>

      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-[var(--moge-text-main)]">任务事件</h2>
        {job.events?.length ? (
          <div className="space-y-4">
            {job.events.map((event, index) => (
              <div key={event.id}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{event.eventType}</Badge>
                      <span className="text-sm font-medium text-[var(--moge-text-main)]">
                        {event.message || '-'}
                      </span>
                    </div>
                    {event.payload !== null && event.payload !== undefined && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-[var(--moge-input-bg)] p-3 text-xs leading-5 text-[var(--moge-text-sub)]">
                        {formatJson(event.payload)}
                      </pre>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--moge-text-muted)]">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
                {index < (job.events?.length ?? 0) - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded border border-dashed py-8 text-center text-sm text-[var(--moge-text-muted)]">
            暂无任务事件
          </p>
        )}
      </Card>
    </div>
  );
}
