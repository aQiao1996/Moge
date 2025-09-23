'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import MdEditor from '@/app/components/MdEditor';
import {
  getOutlineByIdApi,
  getOutlineContentApi,
  updateOutlineContentApi,
} from '@/api/outline.api';
import type { Outline } from '@moge/types';

export default function OutlineEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [outline, setOutline] = useState<Outline | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [outlineData, contentData] = await Promise.all([
          getOutlineByIdApi(id),
          getOutlineContentApi(id),
        ]);

        setOutline(outlineData);
        setContent(contentData?.content ?? '');
      } catch (error) {
        toast.error('加载大纲数据失败');
        console.error('Load outline data error:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    try {
      setSaving(true);
      await updateOutlineContentApi(id, { content });
      toast.success('保存成功');
    } catch (error) {
      toast.error('保存失败');
      console.error('Save content error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/outline/${id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-12 rounded-md" />
          <div className="bg-muted h-96 rounded-md" />
        </div>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">大纲不存在</p>
          <Button onClick={handleBack} className="mt-4">
            返回列表
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{outline.name}</h1>
            <p className="text-muted-foreground text-sm">
              {outline.type} · {outline.era} · {outline.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 编辑器 */}
      <Card className="p-6" style={{ minHeight: 600 }}>
        <MdEditor
          value={content}
          onChange={setContent}
          placeholder="开始编写你的大纲内容..."
          height={600}
          className="border-0"
        />
      </Card>
    </div>
  );
}
