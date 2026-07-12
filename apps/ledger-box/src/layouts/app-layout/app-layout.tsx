import { Outlet } from '@tanstack/react-router';

import { SidebarInset, SidebarProvider } from '@vhnam/ui/components/sidebar';

import { AppSidebar } from './app-sidebar';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex flex-1 flex-col relative">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
