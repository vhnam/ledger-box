import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/wallets/$walletId/settings/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/wallets/$walletId/settings/general', params: { walletId: params.walletId } });
  },
});
