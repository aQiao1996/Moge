'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Zap, Globe, Folder, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// 模拟项目数据
const mockProject = {
  id: '1',
  name: '仙侠传说',
  type: '仙侠',
  createdAt: '2024-01-15',
  settings: {
    characters: 8,
    systems: 3,
    worlds: 5,
    misc: 12,
  },
};

// 设定分类配置
const settingCategories = [
  {
    key: 'characters',
    label: '角色设定',
    icon: Users,
    description: '管理小说中的主要角色、配角和反派角色',
    count: mockProject.settings.characters,
    color: 'text-blue-500',
  },
  {
    key: 'systems',
    label: '系统/金手指',
    icon: Zap,
    description: '配置升级系统、签到系统、抽奖系统等',
    count: mockProject.settings.systems,
    color: 'text-yellow-500',
  },
  {
    key: 'worlds',
    label: '世界背景',
    icon: Globe,
    description: '构建世界观、势力组织、修炼体系等',
    count: mockProject.settings.worlds,
    color: 'text-green-500',
  },
  {
    key: 'misc',
    label: '辅助设定',
    icon: Folder,
    description: '小说标签、分类管理、灵感记录等',
    count: mockProject.settings.misc,
    color: 'text-purple-500',
  },
];

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const handleCategoryClick = (categoryKey: string) => {
    // 将来跳转到具体的设定列表页
    console.log(`Navigate to /settings/${projectId}/${categoryKey}`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* 面包屑导航 */}
      <div className="mb-6 flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            设定集
          </Button>
        </Link>
        <span className="text-[var(--moge-text-muted)]">/</span>
        <span className="font-medium text-[var(--moge-text-main)]">{mockProject.name}</span>
      </div>

      {/* 项目信息头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">
              {mockProject.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {mockProject.type}
              </Badge>
              <span className="text-sm text-[var(--moge-text-muted)]">
                创建于 {mockProject.createdAt}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--moge-text-sub)]">设定总数</p>
            <p className="text-2xl font-bold text-[var(--moge-text-main)]">
              {Object.values(mockProject.settings).reduce((sum, count) => sum + count, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* 设定分类卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {settingCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.key}
              className="border p-6 transition-all duration-200 hover:shadow-[var(--moge-glow-card)]"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${category.color}`} />
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--moge-text-main)]">
                        {category.label}
                      </h3>
                      <p className="text-sm text-[var(--moge-text-sub)]">{category.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                    {category.count}
                  </p>
                  <p className="text-xs text-[var(--moge-text-muted)]">个设定</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleCategoryClick(category.key)}
                  disabled={category.count === 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  查看全部
                </Button>
                <Button variant="outline" onClick={() => handleCategoryClick(category.key)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 开发中提示 */}
      <div className="mt-8">
        <Card
          className="border p-6 text-center"
          style={{
            backgroundColor: 'var(--moge-card-bg)',
            borderColor: 'var(--moge-card-border)',
          }}
        >
          <p className="text-[var(--moge-text-sub)]">具体的设定编辑功能正在开发中，敬请期待...</p>
        </Card>
      </div>
    </div>
  );
}
