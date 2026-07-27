import { createFileRoute } from '@tanstack/react-router';

import { StatementPublicPage } from '#/modules/statement/statement-public-page';

export const Route = createFileRoute('/statement/$token')({
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useParams();

  return <StatementPublicPage token={token} />;
}
