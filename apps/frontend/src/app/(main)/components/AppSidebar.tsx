'use client';
import { Sparkles, BookOpen, Settings, BarChart } from 'lucide-react';
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

const nav = [
  { icon: Sparkles, label: '我的大纲', href: '/' },
  { icon: BookOpen, label: '作品管理', href: '/works' },
  { icon: Settings, label: '设定集', href: '/settings' },
  { icon: BarChart, label: '统计', href: '/stats' },
];

export default function AppSidebar() {
  return (
    <UISidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <Sparkles className="h-6 w-6 text-[var(--moge-primary-400)]" />
          <span className="font-han text-2xl font-bold">墨阁</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton asChild>
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

      <SidebarFooter>
        <p className="font-han brand-sub text-moge-text-sub drop-shadow-moge-glow-weak mt-4 text-base">
          AI 生成 · 小说世界 · 无限灵感
        </p>
      </SidebarFooter>
    </UISidebar>
  );
}
