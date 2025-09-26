'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Zap, Globe, Folder, BookOpen } from 'lucide-react';

type SettingType = 'characters' | 'systems' | 'worlds' | 'misc';

// 模拟数据
const mockStats = {
  characters: 0,
  systems: 0,
  worlds: 0,
  misc: 0,
};

const mockProjects = [
  { id: '1', name: '仙侠传说' },
  { id: '2', name: '都市修仙' },
  { id: '3', name: '末世求生' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingType>('characters');
  const [selectedProject, setSelectedProject] = useState<string>();

  const tabs = [
    { key: 'characters' as const, label: '角色设定', icon: Users, count: mockStats.characters },
    { key: 'systems' as const, label: '系统/金手指', icon: Zap, count: mockStats.systems },
    { key: 'worlds' as const, label: '世界背景', icon: Globe, count: mockStats.worlds },
    { key: 'misc' as const, label: '辅助设定', icon: Folder, count: mockStats.misc },
  ];

  const activeTabConfig = tabs.find((tab) => tab.key === activeTab);

  return (
    <div className="mx-auto max-w-6xl">
      {/* 标题和项目选择器 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">设定集</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="选择小说项目" />
            </SelectTrigger>
            <SelectContent>
              {mockProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Card
              key={tab.key}
              className={`cursor-pointer border p-4 transition-all duration-200 hover:shadow-lg ${
                isActive ? 'border-[var(--moge-primary-400)] shadow-[var(--moge-glow-card)]' : ''
              }`}
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: isActive ? 'var(--moge-primary-400)' : 'var(--moge-card-border)',
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--moge-text-sub)]">{tab.label}</p>
                  <p className="text-2xl font-bold text-[var(--moge-text-main)]">{tab.count}</p>
                </div>
                <Icon
                  className={`h-8 w-8 ${
                    isActive ? 'text-[var(--moge-primary-400)]' : 'text-[var(--moge-text-muted)]'
                  }`}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* 标签页导航 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-1">
                  {tab.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <Card
        className="border p-10 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        {activeTabConfig && (
          <>
            <activeTabConfig.icon className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
            <h2 className="mt-4 text-xl font-semibold text-[var(--moge-text-main)]">
              {activeTabConfig.label}
            </h2>
            <p className="mt-2 text-[var(--moge-text-sub)]">该功能正在开发中，敬请期待...</p>
            {!selectedProject && (
              <p className="mt-4 text-sm text-[var(--moge-text-muted)]">
                请先在上方选择一个小说项目
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
