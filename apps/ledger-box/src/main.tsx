import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ThemeProvider } from '@vhnam/ui/components/theme-provider';
import { Toaster } from '@vhnam/ui/components/toast';
import { TooltipProvider } from '@vhnam/ui/components/tooltip';

import { LocaleProvider } from '#/lib/locale-context';
import { routeTree } from '#/routeTree.gen';

import './style.css';

const router = createRouter({
  routeTree,
  scrollRestoration: true,
});
const queryClient = new QueryClient();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
          </TooltipProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
