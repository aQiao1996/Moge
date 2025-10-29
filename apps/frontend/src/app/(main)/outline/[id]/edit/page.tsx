/**
 * 大纲编辑页
 *
 * 功能：
 * - 编辑大纲总览内容
 * - 编辑卷信息（标题、描述）
 * - 编辑章节信息（标题、内容）
 *
 * 重构说明：
 * - 使用策略模式管理不同类型的保存逻辑
 * - 使用自定义 hooks 简化数据加载
 * - 提高代码可维护性和可测试性
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import MdEditor from '@/app/components/MdEditor';
import { useOutlineData } from '@/app/(main)/outline/hooks/useOutlineData';
import { statusConfig } from '@/app/(main)/outline/constants/statusConfig';
import OutlineStructureSidebar from '@/app/(main)/outline/components/OutlineStructureSidebar';
import {
  saveEditContent,
  type EditState,
  type EditData,
  type EditType,
  type VolumeEditData,
  type ChapterEditData,
} from '@/app/(main)/outline/strategies/outlineSaveStrategies';
import { useDictStore } from '@/stores/dictStore';
import { getDictLabel } from '@/app/(main)/outline/utils/dictUtils';

export default function OutlineEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 字典数据
  const { novelTypes, novelEras, fetchNovelTypes, fetchNovelEras } = useDictStore();

  // 加载字典数据
  useEffect(() => {
    void fetchNovelTypes();
    void fetchNovelEras();
  }, [fetchNovelTypes, fetchNovelEras]);

  // 数据加载
  const { outlineData, loading, expandedVolumes, toggleVolume, setOutlineData, refreshData } =
    useOutlineData({
      outlineId: id,
      autoLoad: true,
    });

  // 本地状态
  const [saving, setSaving] = useState(false);
  const [isStructureSidebarOpen, setStructureSidebarOpen] = useState(true);

  // 编辑状态管理
  const [editState, setEditState] = useState<EditState>({
    type: 'overview',
    title: '大纲总览',
    data: outlineData?.content?.content || '',
  });

  // 当数据加载完成后，初始化编辑状态
  useState(() => {
    if (outlineData?.content?.content && editState.data === '') {
      setEditState({ type: 'overview', title: '大纲总览', data: outlineData.content.content });
    }
  });

  const isGenerating = outlineData?.status === 'GENERATING';

  // 保存编辑内容
  const handleSave = async () => {
    if (!id || !outlineData || saving) return;

    try {
      setSaving(true);
      const updatedData = await saveEditContent(id, editState, outlineData);

      if (updatedData) {
        setOutlineData(updatedData);
      }

      toast.success('保存成功！');
    } catch (error) {
      // 错误已在 saveEditContent 中处理
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/outline/${id}`);
  };

  const handleSelectEdit = (type: EditType, title: string, data: EditData) => {
    setEditState({ type, title, data });
  };

  const handleEditChange = (newData: EditData) => {
    setEditState((prev) => ({ ...prev, data: newData }));
  };

  // 加载状态
  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-12 rounded-md" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="bg-muted h-96 rounded-md" />
            <div className="bg-muted h-96 rounded-md lg:col-span-3" />
          </div>
        </div>
      </div>
    );
  }

  // 数据不存在
  if (!outlineData) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">大纲不存在</p>
          <Button onClick={handleBack} className="mt-4">
            返回详情
          </Button>
        </Card>
      </div>
    );
  }

  const status = statusConfig[outlineData.status as keyof typeof statusConfig];

  return (
    <div className="container mx-auto flex h-full max-w-7xl flex-col overflow-hidden p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{outlineData.name}</h1>
            <p className="text-muted-foreground text-sm">
              {getDictLabel(novelTypes, outlineData.type)} ·{' '}
              {getDictLabel(novelEras, outlineData.era)} · {status?.text || outlineData.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void handleSave()}
            disabled={saving || isGenerating || !editState.data}
            title={
              saving
                ? '保存中...'
                : isGenerating
                  ? '生成中，请等待完成后再编辑'
                  : !editState.data
                    ? '内容为空，无法保存'
                    : `保存${editState.title}`
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row">
        {/* 左侧导航栏 */}
        <OutlineStructureSidebar
          mode="edit"
          outlineData={outlineData}
          activeItemTitle={editState.title}
          onSelectItem={handleSelectEdit}
          expandedVolumes={expandedVolumes}
          onToggleVolume={toggleVolume}
          isOpen={isStructureSidebarOpen}
          onToggle={() => setStructureSidebarOpen(!isStructureSidebarOpen)}
          onRefresh={() => void refreshData()}
        />

        {/* 右侧编辑区域 */}
        <Card className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">编辑：{editState.title}</h2>
          </div>

          {isGenerating ? (
            <div className="flex h-[550px] flex-col items-center justify-center text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground">大纲正在生成中，请等待完成后再进行编辑</p>
                <p className="text-muted-foreground text-sm">您可以返回查看页面查看生成进度</p>
              </div>
            </div>
          ) : (
            <div className="min-h-[550px]">
              {/* 大纲总览编辑 */}
              {editState.type === 'overview' && (
                <MdEditor
                  value={editState.data as string}
                  onChange={handleEditChange}
                  placeholder="开始编写你的大纲总览内容..."
                  height={550}
                  className="border-0"
                />
              )}

              {/* 卷信息编辑 */}
              {editState.type === 'volume' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="volume-title">卷标题</Label>
                    <Input
                      id="volume-title"
                      className="mt-2"
                      value={(editState.data as VolumeEditData).title || ''}
                      onChange={(e) =>
                        handleEditChange({
                          ...(editState.data as VolumeEditData),
                          title: e.target.value,
                        })
                      }
                      placeholder="输入卷标题..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="volume-description">卷描述</Label>
                    <Textarea
                      id="volume-description"
                      className="mt-2"
                      value={(editState.data as VolumeEditData).description || ''}
                      onChange={(e) =>
                        handleEditChange({
                          ...(editState.data as VolumeEditData),
                          description: e.target.value,
                        })
                      }
                      placeholder="输入卷描述..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* 章节信息编辑 */}
              {editState.type === 'chapter' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chapter-title">章节标题</Label>
                    <Input
                      id="chapter-title"
                      className="mt-2"
                      value={(editState.data as ChapterEditData).title || ''}
                      onChange={(e) =>
                        handleEditChange({
                          ...(editState.data as ChapterEditData),
                          title: e.target.value,
                        })
                      }
                      placeholder="输入章节标题..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="chapter-content">章节内容</Label>
                    <div className="mt-2">
                      <MdEditor
                        value={(editState.data as ChapterEditData).content || ''}
                        onChange={(content) =>
                          handleEditChange({
                            ...(editState.data as ChapterEditData),
                            content,
                          })
                        }
                        placeholder="开始编写章节内容..."
                        height={400}
                        className="border"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
