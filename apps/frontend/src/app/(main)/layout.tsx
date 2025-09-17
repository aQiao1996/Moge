'use client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from './components/AppSidebar';
import MainHeader from './components/MainHeader';
import { hanFont } from '@/app/font';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className={hanFont.variable}>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-screen flex-col">
        <MainHeader className="sticky top-0 z-20" />
        <main className="relative z-10 flex-grow overflow-y-auto px-6 py-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
