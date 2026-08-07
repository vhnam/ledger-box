import { Outlet } from '@tanstack/react-router';

import { SidebarInset, SidebarProvider } from '@vhnam/ui/components/sidebar';

import { AppSidebar } from '#/layouts/app-layout/app-sidebar';

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="relative z-0 min-h-svh">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
