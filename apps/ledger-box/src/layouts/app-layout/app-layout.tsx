import { Outlet } from '@tanstack/react-router';

import { SidebarInset, SidebarProvider } from '@vhnam/ui/components/sidebar';

import { AppSidebar } from './app-sidebar';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
