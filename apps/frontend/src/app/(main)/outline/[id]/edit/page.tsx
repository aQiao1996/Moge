'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import MdEditor from '@/app/components/MdEditor';
import {
  getOutlineDetailApi,
  updateOutlineContentApi,
  updateOutlineApi,
  updateVolumeApi,
  updateChapterApi,
} from '@/api/outline.api';
import type { OutlineWithStructure } from '@moge/types';
import { statusConfig } from '../../components/constants';
import OutlineStructureSidebar, {
  type ChapterEditData,
  type VolumeEditData,
  type EditData,
  type EditType,
} from '../../components/OutlineStructureSidebar';

interface EditState {
  type: EditType;
  title: string;
  data: EditData;
}

export default function OutlineEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [outlineData, setOutlineData] = useState<OutlineWithStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [isStructureSidebarOpen, setStructureSidebarOpen] = useState(true);

  // 编辑状态管理
  const [editState, setEditState] = useState<EditState>({
    type: 'overview',
    title: '大纲总览',
    data: '',
  });

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getOutlineDetailApi(id);
      setOutlineData(data);

      // 默认编辑大纲总览
      if (data.content?.content) {
        setEditState({ type: 'overview', title: '大纲总览', data: data.content.content });
      }

      // 默认展开所有卷
      const volumeIds = new Set(
        data.volumes?.map((v) => v.id).filter((id): id is string => Boolean(id)) || []
      );
      setExpandedVolumes(volumeIds);
    } catch (error) {
      console.error('Load outline data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isGenerating = outlineData?.status === 'GENERATING';

  // 保存策略接口
  interface SaveStrategy {
    save(id: string, editState: EditState): Promise<void>;
    updateLocalData?(outlineData: OutlineWithStructure, editState: EditState): OutlineWithStructure;
  }

  // 大纲总览保存策略
  const overviewSaveStrategy: SaveStrategy = {
    async save(id: string, editState: EditState) {
      await updateOutlineContentApi(id, { content: editState.data as string });

      // 如果当前状态是草稿且有内容，自动变更为已完成状态
      if (outlineData?.status === 'DRAFT' && (editState.data as string).trim()) {
        await updateOutlineApi(id, { status: 'PUBLISHED' });
        setOutlineData((prev) => (prev ? { ...prev, status: 'PUBLISHED' } : null));
      }
    },
  };

  // 卷信息保存策略
  const volumeSaveStrategy: SaveStrategy = {
    async save(id: string, editState: EditState) {
      const volumeData = editState.data as VolumeEditData;
      if (!volumeData.id) {
        throw new Error('卷ID缺失，无法保存');
      }

      await updateVolumeApi(id, volumeData.id, {
        title: volumeData.title,
        description: volumeData.description || undefined,
      });
    },

    updateLocalData(outlineData: OutlineWithStructure, editState: EditState): OutlineWithStructure {
      const volumeData = editState.data as VolumeEditData;
      const updatedVolumes = outlineData.volumes?.map((vol) =>
        vol.id === volumeData.id
          ? { ...vol, title: volumeData.title, description: volumeData.description }
          : vol
      );
      return { ...outlineData, volumes: updatedVolumes };
    },
  };

  // 章节信息保存策略
  const chapterSaveStrategy: SaveStrategy = {
    async save(id: string, editState: EditState) {
      const chapterData = editState.data as ChapterEditData;
      if (!chapterData.id) {
        throw new Error('章节ID缺失，无法保存');
      }

      await updateChapterApi(id, chapterData.id, {
        title: chapterData.title,
        content: chapterData.content || undefined,
      });
    },

    updateLocalData(outlineData: OutlineWithStructure, editState: EditState): OutlineWithStructure {
      const chapterData = editState.data as ChapterEditData;

      // 更新卷内章节
      const updatedVolumes = outlineData.volumes?.map((vol) => ({
        ...vol,
        chapters: vol.chapters?.map((chapter) =>
          chapter.id === chapterData.id
            ? {
                ...chapter,
                title: chapterData.title,
                content: chapterData.content
                  ? { ...chapter.content, content: chapterData.content }
                  : chapter.content,
              }
            : chapter
        ),
      }));

      // 更新直接章节
      const updatedChapters = outlineData.chapters?.map((chapter) =>
        chapter.id === chapterData.id
          ? {
              ...chapter,
              title: chapterData.title,
              content: chapterData.content
                ? { ...chapter.content, content: chapterData.content }
                : chapter.content,
            }
          : chapter
      );

      return {
        ...outlineData,
        volumes: updatedVolumes,
        chapters: updatedChapters,
      };
    },
  };

  // 策略映射
  const saveStrategies: Record<EditType, SaveStrategy> = {
    overview: overviewSaveStrategy,
    volume: volumeSaveStrategy,
    chapter: chapterSaveStrategy,
  };

  const handleSave = async () => {
    if (!id || !outlineData || saving) return;

    try {
      setSaving(true);

      const strategy = saveStrategies[editState.type];
      if (!strategy) {
        throw new Error(`未支持的编辑类型: ${editState.type}`);
      }

      // 执行保存
      await strategy.save(id, editState);

      // 更新本地数据
      if (strategy.updateLocalData) {
        setOutlineData((prev) => {
          if (!prev) return null;
          return strategy.updateLocalData!(prev, editState);
        });
      }

      toast.success('保存成功！');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/outline/${id}`);
  };

  const toggleVolumeExpansion = (volumeId: string) => {
    setExpandedVolumes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(volumeId)) {
        newSet.delete(volumeId);
      } else {
        newSet.add(volumeId);
      }
      return newSet;
    });
  };

  const handleSelectEdit = (type: EditType, title: string, data: EditData) => {
    setEditState({ type, title, data });
  };

  const handleEditChange = (newData: EditData) => {
    setEditState((prev) => ({ ...prev, data: newData }));
  };

  useEffect(() => {
    void loadData();
  }, [id]);

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
              {outlineData.type} · {outlineData.era} · {status?.text || outlineData.status}
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
          onToggleVolume={toggleVolumeExpansion}
          isOpen={isStructureSidebarOpen}
          onToggle={() => setStructureSidebarOpen(!isStructureSidebarOpen)}
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
              {editState.type === 'overview' && (
                <MdEditor
                  value={editState.data as string}
                  onChange={handleEditChange}
                  placeholder="开始编写你的大纲总览内容..."
                  height={550}
                  className="border-0"
                />
              )}

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
