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
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';
import MdEditor from '@/app/components/MdEditor';
import {
  getManuscript,
  getChapterContent,
  saveChapterContent,
  type Manuscript,
} from '../../api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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

  // 自动保存定时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);

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
      toast.error('加载文稿失败');
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
      setContent(response.data.content || '');
      contentRef.current = response.data.content || '';
      setLastSaved(response.data.updatedAt ? new Date(response.data.updatedAt) : null);
    } catch (error) {
      console.error('Load chapter content error:', error);
      toast.error('加载章节内容失败');
    }
  }, [chapterId]);

  useEffect(() => {
    void loadManuscript();
  }, [loadManuscript]);

  useEffect(() => {
    if (chapterId) {
      void loadChapterContent();
    }
  }, [chapterId, loadChapterContent]);

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
   * 保存章节内容
   */
  const handleSave = useCallback(async () => {
    if (!chapterId || saving) return;

    try {
      setSaving(true);
      await saveChapterContent(Number(chapterId), { content });
      setLastSaved(new Date());
      toast.success('保存成功');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [chapterId, content, saving]);

  /**
   * 处理内容变更
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      contentRef.current = newContent;
      setWordCount(calculateWordCount(newContent));

      // 清除之前的定时器
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // 设置新的自动保存定时器（30秒后保存）
      autoSaveTimerRef.current = setTimeout(() => {
        void handleSave();
      }, 30000);
    },
    [calculateWordCount, handleSave]
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

  const handleBack = () => {
    router.push(`/manuscripts/${id}`);
  };

  const getCurrentChapter = () => {
    if (!manuscript || !chapterId) return null;

    // 在所有章节中查找
    const allChapters = [
      ...(manuscript.chapters || []),
      ...(manuscript.volumes?.flatMap((v) => v.chapters || []) || []),
    ];

    return allChapters.find((ch) => ch.id?.toString() === chapterId);
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
    <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
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

          {/* 最后保存时间 */}
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-[var(--moge-text-muted)]">
              <Clock className="h-4 w-4" />
              <span>最后保存: {dayjs(lastSaved).fromNow()}</span>
            </div>
          )}

          {/* 保存按钮 */}
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 编辑器区域 */}
      <Card className="flex-1 overflow-hidden p-6">
        <MdEditor
          value={content}
          onChange={handleContentChange}
          placeholder="开始创作你的章节内容..."
          height={600}
          className="border-0"
        />
      </Card>
    </div>
  );
}
