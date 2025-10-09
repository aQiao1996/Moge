'use client';
import { useCallback, useState } from 'react';
import { Globe, Plus, X } from 'lucide-react';
import { type ControllerRenderProps, type FieldPath } from 'react-hook-form';

import {
  createWorldSchema,
  updateWorldSchema,
  type CreateWorldValues,
  type UpdateWorldValues,
  type World,
  worldTypes,
  locationTypes,
  forceTypes,
  customCategories,
  type GeographicLocation,
  type PoliticalForce,
  type CulturalCustom,
  type CultivationLevel,
  type HistoricalEvent,
  type HistoricalFigure,
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
import { createWorld, updateWorld } from '@/api/settings.api';

interface WorldDialogProps {
  mode: 'create' | 'edit';
  world?: World & { id?: number | string };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FormValues = CreateWorldValues | UpdateWorldValues;

export default function WorldDialog({ mode, world, open, onOpenChange }: WorldDialogProps) {
  const isEditMode = mode === 'edit';

  // 动态数组状态
  const [geographicLocations, setGeographicLocations] = useState<GeographicLocation[]>(
    world?.geographicLocations || []
  );
  const [politicalForces, setPoliticalForces] = useState<PoliticalForce[]>(
    world?.politicalForces || []
  );
  const [culturalCustoms, setCulturalCustoms] = useState<CulturalCustom[]>(
    world?.culturalCustoms || []
  );
  const [cultivationLevels, setCultivationLevels] = useState<CultivationLevel[]>(
    world?.cultivationLevels || []
  );
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>(
    world?.historicalEvents || []
  );
  const [historicalFigures, setHistoricalFigures] = useState<HistoricalFigure[]>(
    world?.historicalFigures || []
  );

  // 基础字段配置
  const fields: FieldConfig<FormValues>[] = [
    { name: 'name', label: '世界名称', required: !isEditMode },
    { name: 'type', label: '世界类型', required: !isEditMode },
    { name: 'era', label: '时代背景' },
    { name: 'description', label: '世界描述' },
    { name: 'generalClimate', label: '总体气候' },
    { name: 'majorTerrain', label: '主要地形' },
    { name: 'politicalSystem', label: '政治制度' },
    { name: 'majorConflicts', label: '主要冲突' },
    { name: 'socialStructure', label: '社会结构' },
    { name: 'languages', label: '语言文字' },
    { name: 'religions', label: '宗教信仰' },
    { name: 'powerSystemName', label: '力量体系名称' },
    { name: 'powerSystemDescription', label: '力量体系描述' },
    { name: 'cultivationResources', label: '修炼资源' },
    { name: 'worldHistory', label: '世界历史概述' },
    { name: 'currentEvents', label: '当前时代事件' },
    { name: 'remarks', label: '备注' },
  ];

  const renderControl = useCallback(
    (
      field: ControllerRenderProps<
        CreateWorldValues | UpdateWorldValues,
        FieldPath<CreateWorldValues | UpdateWorldValues>
      >,
      name: FieldPath<CreateWorldValues | UpdateWorldValues>
    ) => {
      if (name === 'type') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择世界类型" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {worldTypes.map((type) => (
                <MogeSelectItem key={type.value} value={type.value}>
                  {type.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (
        [
          'description',
          'majorTerrain',
          'generalClimate',
          'politicalSystem',
          'majorConflicts',
          'socialStructure',
          'languages',
          'religions',
          'powerSystemDescription',
          'cultivationResources',
          'worldHistory',
          'currentEvents',
          'remarks',
        ].includes(name)
      ) {
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
    // 移除可能存在的id字段(编辑模式下form可能包含id)
    const { id: _removedId, ...restValues } = values as FormValues & { id?: string };
    void _removedId; // id通过URL参数传递,不需要在表单数据中
    const submitData = {
      ...restValues,
      geographicLocations,
      politicalForces,
      culturalCustoms,
      cultivationLevels,
      historicalEvents,
      historicalFigures,
    };

    if (isEditMode && world?.id) {
      // 确保id是number类型
      const worldId = typeof world.id === 'string' ? parseInt(world.id) : world.id;
      await updateWorld(worldId, submitData);
    } else {
      await createWorld(submitData);
    }
  };

  // 地理环境管理
  const addGeographicLocation = () => {
    setGeographicLocations([
      ...geographicLocations,
      {
        name: '',
        type: '',
        description: '',
        climate: '',
        terrain: '',
        specialFeatures: '',
      },
    ]);
  };

  const updateGeographicLocation = (
    index: number,
    field: keyof GeographicLocation,
    value: string
  ) => {
    const newLocations = [...geographicLocations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setGeographicLocations(newLocations);
  };

  const removeGeographicLocation = (index: number) => {
    setGeographicLocations(geographicLocations.filter((_, i) => i !== index));
  };

  // 政治势力管理
  const addPoliticalForce = () => {
    setPoliticalForces([
      ...politicalForces,
      {
        name: '',
        type: '',
        description: '',
        territory: '',
        leadership: '',
        ideology: '',
        strength: '',
        relationships: '',
      },
    ]);
  };

  const updatePoliticalForce = (index: number, field: keyof PoliticalForce, value: string) => {
    const newForces = [...politicalForces];
    newForces[index] = { ...newForces[index], [field]: value };
    setPoliticalForces(newForces);
  };

  const removePoliticalForce = (index: number) => {
    setPoliticalForces(politicalForces.filter((_, i) => i !== index));
  };

  // 文化习俗管理
  const addCulturalCustom = () => {
    setCulturalCustoms([
      ...culturalCustoms,
      {
        name: '',
        category: '',
        description: '',
        origin: '',
        significance: '',
        practices: '',
      },
    ]);
  };

  const updateCulturalCustom = (index: number, field: keyof CulturalCustom, value: string) => {
    const newCustoms = [...culturalCustoms];
    newCustoms[index] = { ...newCustoms[index], [field]: value };
    setCulturalCustoms(newCustoms);
  };

  const removeCulturalCustom = (index: number) => {
    setCulturalCustoms(culturalCustoms.filter((_, i) => i !== index));
  };

  // 修炼等级管理
  const addCultivationLevel = () => {
    setCultivationLevels([
      ...cultivationLevels,
      {
        name: '',
        rank: undefined,
        description: '',
        requirements: '',
        abilities: '',
        lifespan: '',
        resources: '',
      },
    ]);
  };

  const updateCultivationLevel = (
    index: number,
    field: keyof CultivationLevel,
    value: string | number | undefined
  ) => {
    const newLevels = [...cultivationLevels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setCultivationLevels(newLevels);
  };

  const removeCultivationLevel = (index: number) => {
    setCultivationLevels(cultivationLevels.filter((_, i) => i !== index));
  };

  // 历史事件管理
  const addHistoricalEvent = () => {
    setHistoricalEvents([
      ...historicalEvents,
      {
        name: '',
        timeframe: '',
        description: '',
        participants: '',
        causes: '',
        consequences: '',
        significance: '',
      },
    ]);
  };

  const updateHistoricalEvent = (index: number, field: keyof HistoricalEvent, value: string) => {
    const newEvents = [...historicalEvents];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setHistoricalEvents(newEvents);
  };

  const removeHistoricalEvent = (index: number) => {
    setHistoricalEvents(historicalEvents.filter((_, i) => i !== index));
  };

  // 历史人物管理
  const addHistoricalFigure = () => {
    setHistoricalFigures([
      ...historicalFigures,
      {
        name: '',
        title: '',
        era: '',
        description: '',
        achievements: '',
        background: '',
        legacy: '',
      },
    ]);
  };

  const updateHistoricalFigure = (index: number, field: keyof HistoricalFigure, value: string) => {
    const newFigures = [...historicalFigures];
    newFigures[index] = { ...newFigures[index], [field]: value };
    setHistoricalFigures(newFigures);
  };

  const removeHistoricalFigure = (index: number) => {
    setHistoricalFigures(historicalFigures.filter((_, i) => i !== index));
  };

  // 渲染地理环境区域
  const renderGeographicSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">重要地点</Label>
        <Button type="button" variant="outline" size="sm" onClick={addGeographicLocation}>
          <Plus className="mr-1 h-3 w-3" />
          添加地点
        </Button>
      </div>
      <div className="space-y-3">
        {geographicLocations.map((location, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">地点 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGeographicLocation(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="地点名称"
                  value={location.name}
                  onChange={(e) => updateGeographicLocation(index, 'name', e.target.value)}
                />
                <MogeSelect
                  value={location.type || ''}
                  onValueChange={(value) => updateGeographicLocation(index, 'type', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="地点类型" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {locationTypes.map((type) => (
                      <MogeSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="地点描述"
                value={location.description || ''}
                onChange={(e) => updateGeographicLocation(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="气候条件"
                  value={location.climate || ''}
                  onChange={(e) => updateGeographicLocation(index, 'climate', e.target.value)}
                />
                <MogeInput
                  placeholder="地形地貌"
                  value={location.terrain || ''}
                  onChange={(e) => updateGeographicLocation(index, 'terrain', e.target.value)}
                />
                <MogeInput
                  placeholder="特殊特征"
                  value={location.specialFeatures || ''}
                  onChange={(e) =>
                    updateGeographicLocation(index, 'specialFeatures', e.target.value)
                  }
                />
              </div>
            </div>
          </Card>
        ))}
        {geographicLocations.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无重要地点，点击"添加地点"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染政治势力区域
  const renderPoliticalSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">政治势力</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPoliticalForce}>
          <Plus className="mr-1 h-3 w-3" />
          添加势力
        </Button>
      </div>
      <div className="space-y-3">
        {politicalForces.map((force, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">势力 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePoliticalForce(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="势力名称"
                  value={force.name}
                  onChange={(e) => updatePoliticalForce(index, 'name', e.target.value)}
                />
                <MogeSelect
                  value={force.type || ''}
                  onValueChange={(value) => updatePoliticalForce(index, 'type', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="势力类型" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {forceTypes.map((type) => (
                      <MogeSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="势力描述"
                value={force.description || ''}
                onChange={(e) => updatePoliticalForce(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="控制区域"
                  value={force.territory || ''}
                  onChange={(e) => updatePoliticalForce(index, 'territory', e.target.value)}
                />
                <MogeInput
                  placeholder="领导结构"
                  value={force.leadership || ''}
                  onChange={(e) => updatePoliticalForce(index, 'leadership', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="核心理念"
                  value={force.ideology || ''}
                  onChange={(e) => updatePoliticalForce(index, 'ideology', e.target.value)}
                />
                <MogeInput
                  placeholder="实力等级"
                  value={force.strength || ''}
                  onChange={(e) => updatePoliticalForce(index, 'strength', e.target.value)}
                />
                <MogeInput
                  placeholder="对外关系"
                  value={force.relationships || ''}
                  onChange={(e) => updatePoliticalForce(index, 'relationships', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {politicalForces.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无政治势力，点击"添加势力"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染文化体系区域
  const renderCulturalSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">文化习俗</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCulturalCustom}>
          <Plus className="mr-1 h-3 w-3" />
          添加习俗
        </Button>
      </div>
      <div className="space-y-3">
        {culturalCustoms.map((custom, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">习俗 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCulturalCustom(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="习俗名称"
                  value={custom.name}
                  onChange={(e) => updateCulturalCustom(index, 'name', e.target.value)}
                />
                <MogeSelect
                  value={custom.category || ''}
                  onValueChange={(value) => updateCulturalCustom(index, 'category', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="习俗分类" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {customCategories.map((category) => (
                      <MogeSelectItem key={category.value} value={category.value}>
                        {category.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="习俗描述"
                value={custom.description || ''}
                onChange={(e) => updateCulturalCustom(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="起源"
                  value={custom.origin || ''}
                  onChange={(e) => updateCulturalCustom(index, 'origin', e.target.value)}
                />
                <MogeInput
                  placeholder="意义"
                  value={custom.significance || ''}
                  onChange={(e) => updateCulturalCustom(index, 'significance', e.target.value)}
                />
                <MogeInput
                  placeholder="具体做法"
                  value={custom.practices || ''}
                  onChange={(e) => updateCulturalCustom(index, 'practices', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {culturalCustoms.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无文化习俗，点击"添加习俗"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染修炼体系区域
  const renderCultivationSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">修炼境界</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCultivationLevel}>
          <Plus className="mr-1 h-3 w-3" />
          添加境界
        </Button>
      </div>
      <div className="space-y-3">
        {cultivationLevels.map((level, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">境界 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCultivationLevel(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="境界名称"
                  value={level.name}
                  onChange={(e) => updateCultivationLevel(index, 'name', e.target.value)}
                />
                <MogeInput
                  type="number"
                  placeholder="等级序号"
                  value={level.rank?.toString() || ''}
                  onChange={(e) =>
                    updateCultivationLevel(
                      index,
                      'rank',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
                <MogeInput
                  placeholder="寿命影响"
                  value={level.lifespan || ''}
                  onChange={(e) => updateCultivationLevel(index, 'lifespan', e.target.value)}
                />
              </div>
              <MogeTextarea
                placeholder="境界描述"
                value={level.description || ''}
                onChange={(e) => updateCultivationLevel(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="突破条件"
                  value={level.requirements || ''}
                  onChange={(e) => updateCultivationLevel(index, 'requirements', e.target.value)}
                />
                <MogeInput
                  placeholder="境界能力"
                  value={level.abilities || ''}
                  onChange={(e) => updateCultivationLevel(index, 'abilities', e.target.value)}
                />
                <MogeInput
                  placeholder="所需资源"
                  value={level.resources || ''}
                  onChange={(e) => updateCultivationLevel(index, 'resources', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {cultivationLevels.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无修炼境界，点击"添加境界"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染历史脉络区域
  const renderHistoricalSection = () => (
    <div className="space-y-4">
      {/* 历史事件 */}
      <Card
        className="p-4"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-sm font-medium text-[var(--moge-text-main)]">重大事件</Label>
          <Button type="button" variant="outline" size="sm" onClick={addHistoricalEvent}>
            <Plus className="mr-1 h-3 w-3" />
            添加事件
          </Button>
        </div>
        <div className="space-y-3">
          {historicalEvents.map((event, index) => (
            <Card
              key={index}
              className="p-3"
              style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
            >
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs text-[var(--moge-text-sub)]">事件 {index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHistoricalEvent(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <MogeInput
                    placeholder="事件名称"
                    value={event.name}
                    onChange={(e) => updateHistoricalEvent(index, 'name', e.target.value)}
                  />
                  <MogeInput
                    placeholder="时间段"
                    value={event.timeframe || ''}
                    onChange={(e) => updateHistoricalEvent(index, 'timeframe', e.target.value)}
                  />
                </div>
                <MogeTextarea
                  placeholder="事件描述"
                  value={event.description || ''}
                  onChange={(e) => updateHistoricalEvent(index, 'description', e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <MogeInput
                    placeholder="参与者"
                    value={event.participants || ''}
                    onChange={(e) => updateHistoricalEvent(index, 'participants', e.target.value)}
                  />
                  <MogeInput
                    placeholder="历史意义"
                    value={event.significance || ''}
                    onChange={(e) => updateHistoricalEvent(index, 'significance', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <MogeInput
                    placeholder="起因"
                    value={event.causes || ''}
                    onChange={(e) => updateHistoricalEvent(index, 'causes', e.target.value)}
                  />
                  <MogeInput
                    placeholder="后果"
                    value={event.consequences || ''}
                    onChange={(e) => updateHistoricalEvent(index, 'consequences', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          ))}
          {historicalEvents.length === 0 && (
            <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
              暂无重大事件，点击"添加事件"开始创建
            </div>
          )}
        </div>
      </Card>

      {/* 历史人物 */}
      <Card
        className="p-4"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-sm font-medium text-[var(--moge-text-main)]">历史人物</Label>
          <Button type="button" variant="outline" size="sm" onClick={addHistoricalFigure}>
            <Plus className="mr-1 h-3 w-3" />
            添加人物
          </Button>
        </div>
        <div className="space-y-3">
          {historicalFigures.map((figure, index) => (
            <Card
              key={index}
              className="p-3"
              style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
            >
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs text-[var(--moge-text-sub)]">人物 {index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHistoricalFigure(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <MogeInput
                    placeholder="人物姓名"
                    value={figure.name}
                    onChange={(e) => updateHistoricalFigure(index, 'name', e.target.value)}
                  />
                  <MogeInput
                    placeholder="称号"
                    value={figure.title || ''}
                    onChange={(e) => updateHistoricalFigure(index, 'title', e.target.value)}
                  />
                  <MogeInput
                    placeholder="所处时代"
                    value={figure.era || ''}
                    onChange={(e) => updateHistoricalFigure(index, 'era', e.target.value)}
                  />
                </div>
                <MogeTextarea
                  placeholder="人物描述"
                  value={figure.description || ''}
                  onChange={(e) => updateHistoricalFigure(index, 'description', e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <MogeInput
                    placeholder="主要成就"
                    value={figure.achievements || ''}
                    onChange={(e) => updateHistoricalFigure(index, 'achievements', e.target.value)}
                  />
                  <MogeInput
                    placeholder="背景故事"
                    value={figure.background || ''}
                    onChange={(e) => updateHistoricalFigure(index, 'background', e.target.value)}
                  />
                  <MogeInput
                    placeholder="历史影响"
                    value={figure.legacy || ''}
                    onChange={(e) => updateHistoricalFigure(index, 'legacy', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          ))}
          {historicalFigures.length === 0 && (
            <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
              暂无历史人物，点击"添加人物"开始创建
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  // 默认触发器
  const defaultTrigger = (
    <Button>
      <Globe className="mr-2 h-4 w-4" />
      新建世界设定
    </Button>
  );

  return (
    <MogeFormDialog
      mode={mode}
      title={isEditMode ? '编辑世界设定' : '新建世界设定'}
      description={isEditMode ? '修改世界设定信息' : '创建一个新的世界背景设定'}
      open={open}
      onOpenChange={onOpenChange}
      createSchema={createWorldSchema}
      updateSchema={updateWorldSchema}
      defaultValues={{
        name: '',
        type: '',
        era: '',
        description: '',
        generalClimate: '',
        majorTerrain: '',
        politicalSystem: '',
        majorConflicts: '',
        socialStructure: '',
        languages: '',
        religions: '',
        powerSystemName: '',
        powerSystemDescription: '',
        cultivationResources: '',
        worldHistory: '',
        currentEvents: '',
        tags: [],
        remarks: '',
      }}
      onSubmit={onSubmit}
      fields={fields as FormFieldConfig<CreateWorldValues | UpdateWorldValues>[]}
      renderControl={renderControl}
      customSections={[
        {
          title: '地理环境',
          content: renderGeographicSection(),
        },
        {
          title: '政治势力',
          content: renderPoliticalSection(),
        },
        {
          title: '文化体系',
          content: renderCulturalSection(),
        },
        {
          title: '修炼/力量体系',
          content: renderCultivationSection(),
        },
        {
          title: '历史脉络',
          content: renderHistoricalSection(),
        },
      ]}
      defaultTrigger={defaultTrigger}
      item={world}
      maxWidth="4xl"
    />
  );
}
