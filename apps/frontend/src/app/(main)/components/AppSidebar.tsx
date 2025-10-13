'use client';

import { Sparkles, BookText, Settings, BarChart, LayoutDashboard, Database } from 'lucide-react';
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

// 导航菜单配置
const nav = [
  { icon: LayoutDashboard, label: '工作台', href: '/workspace' },
  { icon: Sparkles, label: '大纲', href: '/outline' },
  { icon: BookText, label: '文稿', href: '/manuscripts' },
  { icon: Settings, label: '设定集', href: '/settings' },
  { icon: Database, label: '字典管理', href: '/dictionary' },
  { icon: BarChart, label: '统计', href: '/stats' },
];

/**
 * 应用侧边栏组件
 *
 * 功能：
 * - 展示应用Logo和名称
 * - 导航菜单（工作台、大纲、文稿、设定集、字典管理、统计）
 * - 支持展开/收起切换
 * - 高亮当前激活的菜单项
 * - 底部品牌标语
 */
export default function AppSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();

  /**
   * 检查当前路径是否匹配菜单项
   * 特殊处理：工作台同时匹配 /workspace 和根路径 /
   */
  const isActive = (href: string) => {
    if (href === '/workspace') {
      return pathname === '/workspace' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <UISidebar collapsible="icon">
      {/* Logo和应用名称 */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <Sparkles className="h-6 w-6 flex-shrink-0 text-[var(--moge-primary-400)]" />
          <span
            className={`font-han origin-left whitespace-nowrap text-2xl font-bold transition-all duration-200 ${
              open ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
            }`}
          >
            墨阁
          </span>
        </div>
      </SidebarHeader>

      {/* 导航菜单列表 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton asChild isActive={isActive(n.href)}>
                    <Link href={n.href}>
                      <n.icon className="mr-2 h-4 w-4" />
                      <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 底部品牌标语 */}
      <SidebarFooter>
        <p
          className={`font-han brand-sub text-moge-text-sub drop-shadow-moge-glow-weak mt-4 origin-left whitespace-nowrap text-base transition-all duration-200 ${
            open ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
          }`}
        >
          AI 生成 · 小说世界 · 无限灵感
        </p>
      </SidebarFooter>
    </UISidebar>
  );
}
