'use client';
import { Sparkles, BookText, Globe2, BarChart, LayoutDashboard } from 'lucide-react';
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

const nav = [
  { icon: LayoutDashboard, label: '工作台', href: '/workspace' },
  { icon: Sparkles, label: '大纲', href: '/outline' },
  { icon: BookText, label: '文稿', href: '/manuscripts' },
  { icon: Globe2, label: '世界观', href: '/worldview' },
  { icon: BarChart, label: '统计', href: '/stats' },
];

export default function AppSidebar() {
  const { open } = useSidebar();

  return (
    <UISidebar collapsible="icon">
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
