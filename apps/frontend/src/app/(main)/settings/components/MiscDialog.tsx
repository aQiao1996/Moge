'use client';
import { useCallback, useState } from 'react';
import { Folder, Plus, X } from 'lucide-react';
import { type ControllerRenderProps, type FieldPath } from 'react-hook-form';

import {
  createMiscSchema,
  updateMiscSchema,
  type CreateMiscValues,
  type UpdateMiscValues,
  type Misc,
  miscTypes,
  ideaTypes,
  materialTypes,
  noteTypes,
  terminologyCategories,
  templateTypes,
  tagCategories,
  type IdeaRecord,
  type ReferenceMaterial,
  type CreativeNote,
  type Terminology,
  type Template,
  type ProjectTag,
} from '@moge/types';

import MogeFormDialog, {
  type FieldConfig,
  type FormFieldConfig,
} from '@/app/components/MogeFormDialog';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';
import {
  MogeSelect,
  MogeSelectContent,
  MogeSelectItem,
  MogeSelectTrigger,
  MogeSelectValue,
} from '@/app/components/MogeSelect';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface MiscDialogProps {
  mode: 'create' | 'edit';
  misc?: Misc;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FormValues = CreateMiscValues | UpdateMiscValues;

export default function MiscDialog({ mode, misc, open, onOpenChange }: MiscDialogProps) {
  const isEditMode = mode === 'edit';

  // 动态数组状态
  const [ideaRecords, setIdeaRecords] = useState<IdeaRecord[]>(misc?.ideaRecords || []);
  const [referenceMaterials, setReferenceMaterials] = useState<ReferenceMaterial[]>(
    misc?.referenceMaterials || []
  );
  const [creativeNotes, setCreativeNotes] = useState<CreativeNote[]>(misc?.creativeNotes || []);
  const [terminology, setTerminology] = useState<Terminology[]>(misc?.terminology || []);
  const [templates, setTemplates] = useState<Template[]>(misc?.templates || []);
  const [projectTags, setProjectTags] = useState<ProjectTag[]>(misc?.projectTags || []);

  // 基础字段配置
  const fields: FieldConfig<FormValues>[] = [
    { name: 'name', label: '辅助设定名称', required: !isEditMode },
    { name: 'type', label: '辅助设定类型', required: !isEditMode },
    { name: 'description', label: '描述说明' },
    { name: 'remark', label: '备注' },
  ];

  const renderControl = useCallback(
    (
      field: ControllerRenderProps<
        CreateMiscValues | UpdateMiscValues,
        FieldPath<CreateMiscValues | UpdateMiscValues>
      >,
      name: FieldPath<CreateMiscValues | UpdateMiscValues>
    ) => {
      if (name === 'type') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择辅助设定类型" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {miscTypes.map((type) => (
                <MogeSelectItem key={type.value} value={type.value}>
                  {type.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (name === 'description' || name === 'remark') {
        return (
          <MogeTextarea
            placeholder={`请输入${fields.find((f) => f.name === name)?.label}`}
            value={field.value as string}
            onChange={field.onChange}
            className="min-h-[80px]"
          />
        );
      }

      return (
        <MogeInput
          placeholder={`请输入${fields.find((f) => f.name === name)?.label}`}
          value={field.value as string}
          onChange={field.onChange}
        />
      );
    },
    [fields]
  );

  // 处理提交
  const onSubmit = async (values: FormValues) => {
    const submitData = {
      ...values,
      ideaRecords,
      referenceMaterials,
      creativeNotes,
      terminology,
      templates,
      projectTags,
    };

    await Promise.resolve(1);
    console.log('提交辅助设定:', submitData);
    // TODO: 实际的API调用
  };

  // 灵感记录管理
  const addIdeaRecord = () => {
    setIdeaRecords([
      ...ideaRecords,
      {
        title: '',
        type: '',
        content: '',
        source: '',
        priority: '',
        status: '',
        relatedChapters: '',
      },
    ]);
  };

  const updateIdeaRecord = (index: number, field: keyof IdeaRecord, value: string) => {
    const newRecords = [...ideaRecords];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setIdeaRecords(newRecords);
  };

  const removeIdeaRecord = (index: number) => {
    setIdeaRecords(ideaRecords.filter((_, i) => i !== index));
  };

  // 参考资料管理
  const addReferenceMaterial = () => {
    setReferenceMaterials([
      ...referenceMaterials,
      {
        title: '',
        type: '',
        content: '',
        url: '',
        filePath: '',
        description: '',
        tags: '',
        source: '',
      },
    ]);
  };

  const updateReferenceMaterial = (
    index: number,
    field: keyof ReferenceMaterial,
    value: string
  ) => {
    const newMaterials = [...referenceMaterials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setReferenceMaterials(newMaterials);
  };

  const removeReferenceMaterial = (index: number) => {
    setReferenceMaterials(referenceMaterials.filter((_, i) => i !== index));
  };

  // 创作笔记管理
  const addCreativeNote = () => {
    setCreativeNotes([
      ...creativeNotes,
      {
        title: '',
        type: '',
        content: '',
        relatedChapters: '',
        importance: '',
        lastModified: '',
      },
    ]);
  };

  const updateCreativeNote = (index: number, field: keyof CreativeNote, value: string) => {
    const newNotes = [...creativeNotes];
    newNotes[index] = { ...newNotes[index], [field]: value };
    setCreativeNotes(newNotes);
  };

  const removeCreativeNote = (index: number) => {
    setCreativeNotes(creativeNotes.filter((_, i) => i !== index));
  };

  // 术语管理
  const addTerminology = () => {
    setTerminology([
      ...terminology,
      {
        term: '',
        category: '',
        definition: '',
        pronunciation: '',
        usage: '',
        examples: '',
        relatedTerms: '',
      },
    ]);
  };

  const updateTerminology = (index: number, field: keyof Terminology, value: string) => {
    const newTerms = [...terminology];
    newTerms[index] = { ...newTerms[index], [field]: value };
    setTerminology(newTerms);
  };

  const removeTerminology = (index: number) => {
    setTerminology(terminology.filter((_, i) => i !== index));
  };

  // 模板管理
  const addTemplate = () => {
    setTemplates([
      ...templates,
      {
        name: '',
        type: '',
        content: '',
        description: '',
        useCount: 0,
        variables: '',
        tags: '',
      },
    ]);
  };

  const updateTemplate = (
    index: number,
    field: keyof Template,
    value: string | number | undefined
  ) => {
    const newTemplates = [...templates];
    newTemplates[index] = { ...newTemplates[index], [field]: value };
    setTemplates(newTemplates);
  };

  const removeTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };

  // 项目标签管理
  const addProjectTag = () => {
    setProjectTags([
      ...projectTags,
      {
        name: '',
        category: '',
        description: '',
        color: '',
        useCount: 0,
        relatedContent: '',
      },
    ]);
  };

  const updateProjectTag = (
    index: number,
    field: keyof ProjectTag,
    value: string | number | undefined
  ) => {
    const newTags = [...projectTags];
    newTags[index] = { ...newTags[index], [field]: value };
    setProjectTags(newTags);
  };

  const removeProjectTag = (index: number) => {
    setProjectTags(projectTags.filter((_, i) => i !== index));
  };

  // 渲染灵感记录区域
  const renderIdeaRecordsSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">灵感记录</Label>
        <Button type="button" variant="outline" size="sm" onClick={addIdeaRecord}>
          <Plus className="mr-1 h-3 w-3" />
          添加灵感
        </Button>
      </div>
      <div className="space-y-3">
        {ideaRecords.map((record, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">灵感 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeIdeaRecord(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="灵感标题"
                  value={record.title}
                  onChange={(e) => updateIdeaRecord(index, 'title', e.target.value)}
                />
                <MogeSelect
                  value={record.type || ''}
                  onValueChange={(value) => updateIdeaRecord(index, 'type', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="灵感类型" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {ideaTypes.map((type) => (
                      <MogeSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="灵感内容"
                value={record.content || ''}
                onChange={(e) => updateIdeaRecord(index, 'content', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="灵感来源"
                  value={record.source || ''}
                  onChange={(e) => updateIdeaRecord(index, 'source', e.target.value)}
                />
                <MogeInput
                  placeholder="优先级"
                  value={record.priority || ''}
                  onChange={(e) => updateIdeaRecord(index, 'priority', e.target.value)}
                />
                <MogeInput
                  placeholder="状态"
                  value={record.status || ''}
                  onChange={(e) => updateIdeaRecord(index, 'status', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {ideaRecords.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无灵感记录，点击"添加灵感"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染参考资料区域
  const renderReferenceMaterialsSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">参考资料</Label>
        <Button type="button" variant="outline" size="sm" onClick={addReferenceMaterial}>
          <Plus className="mr-1 h-3 w-3" />
          添加资料
        </Button>
      </div>
      <div className="space-y-3">
        {referenceMaterials.map((material, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">资料 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeReferenceMaterial(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="资料标题"
                  value={material.title}
                  onChange={(e) => updateReferenceMaterial(index, 'title', e.target.value)}
                />
                <MogeSelect
                  value={material.type || ''}
                  onValueChange={(value) => updateReferenceMaterial(index, 'type', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="资料类型" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {materialTypes.map((type) => (
                      <MogeSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="链接地址"
                  value={material.url || ''}
                  onChange={(e) => updateReferenceMaterial(index, 'url', e.target.value)}
                />
                <MogeInput
                  placeholder="文件路径"
                  value={material.filePath || ''}
                  onChange={(e) => updateReferenceMaterial(index, 'filePath', e.target.value)}
                />
              </div>
              <MogeTextarea
                placeholder="资料描述"
                value={material.description || ''}
                onChange={(e) => updateReferenceMaterial(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="标签"
                  value={material.tags || ''}
                  onChange={(e) => updateReferenceMaterial(index, 'tags', e.target.value)}
                />
                <MogeInput
                  placeholder="来源"
                  value={material.source || ''}
                  onChange={(e) => updateReferenceMaterial(index, 'source', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {referenceMaterials.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无参考资料，点击"添加资料"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染创作笔记区域
  const renderCreativeNotesSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">创作笔记</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCreativeNote}>
          <Plus className="mr-1 h-3 w-3" />
          添加笔记
        </Button>
      </div>
      <div className="space-y-3">
        {creativeNotes.map((note, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">笔记 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCreativeNote(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="笔记标题"
                  value={note.title}
                  onChange={(e) => updateCreativeNote(index, 'title', e.target.value)}
                />
                <MogeSelect
                  value={note.type || ''}
                  onValueChange={(value) => updateCreativeNote(index, 'type', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="笔记类型" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {noteTypes.map((type) => (
                      <MogeSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="笔记内容"
                value={note.content || ''}
                onChange={(e) => updateCreativeNote(index, 'content', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="相关章节"
                  value={note.relatedChapters || ''}
                  onChange={(e) => updateCreativeNote(index, 'relatedChapters', e.target.value)}
                />
                <MogeInput
                  placeholder="重要程度"
                  value={note.importance || ''}
                  onChange={(e) => updateCreativeNote(index, 'importance', e.target.value)}
                />
                <MogeInput
                  placeholder="最后修改时间"
                  value={note.lastModified || ''}
                  onChange={(e) => updateCreativeNote(index, 'lastModified', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {creativeNotes.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无创作笔记，点击"添加笔记"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染术语管理区域
  const renderTerminologySection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">专业术语</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTerminology}>
          <Plus className="mr-1 h-3 w-3" />
          添加术语
        </Button>
      </div>
      <div className="space-y-3">
        {terminology.map((term, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">术语 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTerminology(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="术语名称"
                  value={term.term}
                  onChange={(e) => updateTerminology(index, 'term', e.target.value)}
                />
                <MogeSelect
                  value={term.category || ''}
                  onValueChange={(value) => updateTerminology(index, 'category', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="术语分类" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {terminologyCategories.map((category) => (
                      <MogeSelectItem key={category.value} value={category.value}>
                        {category.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="术语解释"
                value={term.definition || ''}
                onChange={(e) => updateTerminology(index, 'definition', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="发音/读音"
                  value={term.pronunciation || ''}
                  onChange={(e) => updateTerminology(index, 'pronunciation', e.target.value)}
                />
                <MogeInput
                  placeholder="使用场景"
                  value={term.usage || ''}
                  onChange={(e) => updateTerminology(index, 'usage', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="使用示例"
                  value={term.examples || ''}
                  onChange={(e) => updateTerminology(index, 'examples', e.target.value)}
                />
                <MogeInput
                  placeholder="相关术语"
                  value={term.relatedTerms || ''}
                  onChange={(e) => updateTerminology(index, 'relatedTerms', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {terminology.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无专业术语，点击"添加术语"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染模板库区域
  const renderTemplatesSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">模板库</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTemplate}>
          <Plus className="mr-1 h-3 w-3" />
          添加模板
        </Button>
      </div>
      <div className="space-y-3">
        {templates.map((template, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">模板 {index + 1}</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeTemplate(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="模板名称"
                  value={template.name}
                  onChange={(e) => updateTemplate(index, 'name', e.target.value)}
                />
                <MogeSelect
                  value={template.type || ''}
                  onValueChange={(value) => updateTemplate(index, 'type', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="模板类型" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {templateTypes.map((type) => (
                      <MogeSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="模板内容"
                value={template.content || ''}
                onChange={(e) => updateTemplate(index, 'content', e.target.value)}
                className="min-h-[60px]"
              />
              <MogeTextarea
                placeholder="模板描述"
                value={template.description || ''}
                onChange={(e) => updateTemplate(index, 'description', e.target.value)}
                className="min-h-[40px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="可变参数说明"
                  value={template.variables || ''}
                  onChange={(e) => updateTemplate(index, 'variables', e.target.value)}
                />
                <MogeInput
                  placeholder="标签"
                  value={template.tags || ''}
                  onChange={(e) => updateTemplate(index, 'tags', e.target.value)}
                />
                <MogeInput
                  type="number"
                  placeholder="使用次数"
                  value={template.useCount?.toString() || ''}
                  onChange={(e) =>
                    updateTemplate(
                      index,
                      'useCount',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无模板库，点击"添加模板"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染项目标签区域
  const renderProjectTagsSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">项目标签</Label>
        <Button type="button" variant="outline" size="sm" onClick={addProjectTag}>
          <Plus className="mr-1 h-3 w-3" />
          添加标签
        </Button>
      </div>
      <div className="space-y-3">
        {projectTags.map((tag, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">标签 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeProjectTag(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="标签名称"
                  value={tag.name}
                  onChange={(e) => updateProjectTag(index, 'name', e.target.value)}
                />
                <MogeSelect
                  value={tag.category || ''}
                  onValueChange={(value) => updateProjectTag(index, 'category', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="标签分类" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {tagCategories.map((category) => (
                      <MogeSelectItem key={category.value} value={category.value}>
                        {category.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
                <MogeInput
                  placeholder="标签颜色"
                  value={tag.color || ''}
                  onChange={(e) => updateProjectTag(index, 'color', e.target.value)}
                />
              </div>
              <MogeInput
                placeholder="标签描述"
                value={tag.description || ''}
                onChange={(e) => updateProjectTag(index, 'description', e.target.value)}
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="关联内容"
                  value={tag.relatedContent || ''}
                  onChange={(e) => updateProjectTag(index, 'relatedContent', e.target.value)}
                />
                <MogeInput
                  type="number"
                  placeholder="使用次数"
                  value={tag.useCount?.toString() || ''}
                  onChange={(e) =>
                    updateProjectTag(
                      index,
                      'useCount',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </Card>
        ))}
        {projectTags.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无项目标签，点击"添加标签"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 默认触发器
  const defaultTrigger = (
    <Button>
      <Folder className="mr-2 h-4 w-4" />
      新建辅助设定
    </Button>
  );

  return (
    <MogeFormDialog
      mode={mode}
      title={isEditMode ? '编辑辅助设定' : '新建辅助设定'}
      description={isEditMode ? '修改辅助设定信息' : '创建一个新的辅助设定'}
      open={open}
      onOpenChange={onOpenChange}
      createSchema={createMiscSchema}
      updateSchema={updateMiscSchema}
      defaultValues={{
        name: '',
        type: '',
        description: '',
        tags: [],
        remark: '',
      }}
      onSubmit={onSubmit}
      fields={fields as FormFieldConfig<CreateMiscValues | UpdateMiscValues>[]}
      renderControl={renderControl}
      customSections={[
        {
          title: '灵感记录',
          content: renderIdeaRecordsSection(),
        },
        {
          title: '参考资料',
          content: renderReferenceMaterialsSection(),
        },
        {
          title: '创作笔记',
          content: renderCreativeNotesSection(),
        },
        {
          title: '专业术语',
          content: renderTerminologySection(),
        },
        {
          title: '模板库',
          content: renderTemplatesSection(),
        },
        {
          title: '项目标签',
          content: renderProjectTagsSection(),
        },
      ]}
      defaultTrigger={defaultTrigger}
      item={misc}
      maxWidth="4xl"
    />
  );
}
