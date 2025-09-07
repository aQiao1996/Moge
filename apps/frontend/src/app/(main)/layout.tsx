'use client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from './components/AppSidebar';
import MainHeader from './components/MainHeader';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative min-h-screen">
        <MainHeader />
        <main className="relative z-10 px-6 py-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
