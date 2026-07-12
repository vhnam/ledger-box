import { createFileRoute, Outlet } from '@tanstack/react-router';

import { Card } from '@vhnam/ui/components/card';

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <section id="auth" className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <Outlet />
        </Card>
      </div>
    </section>
  );
}
