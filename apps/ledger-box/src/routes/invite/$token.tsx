import { createFileRoute } from '@tanstack/react-router';

import { InvitePublicPage } from '#/modules/invite/invite-public-page';

export const Route = createFileRoute('/invite/$token')({
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useParams();

  return <InvitePublicPage token={token} />;
}
