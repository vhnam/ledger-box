import { createFileRoute, stripSearchParams, type SearchSchemaInput } from '@tanstack/react-router';
import * as v from 'valibot';

import {
  resolveWalletActivitySearch,
  WALLET_ACTIVITY_SEARCH_DEFAULTS,
  walletActivitySearchSchema,
  type WalletActivitySearchInput,
} from '#/schemas/wallet-activity-search.schema';

import { WalletSettingsActivityRoute } from '#/modules/wallet-settings/wallet-settings-activity';

export const Route = createFileRoute('/_app/wallets/$walletId/settings/activity')({
  validateSearch: (search: WalletActivitySearchInput & SearchSchemaInput) =>
    resolveWalletActivitySearch(v.parse(walletActivitySearchSchema, search)),
  search: {
    middlewares: [stripSearchParams(WALLET_ACTIVITY_SEARCH_DEFAULTS)],
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletSettingsActivityRoute walletId={walletId} />;
}
