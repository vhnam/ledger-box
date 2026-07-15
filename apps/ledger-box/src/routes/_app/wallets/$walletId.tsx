import { createFileRoute, stripSearchParams, type SearchSchemaInput } from '@tanstack/react-router';
import * as v from 'valibot';

import { WalletPage } from '#/modules/wallets/wallet-page';
import {
  resolveWalletTransactionSearch,
  WALLET_TRANSACTION_SEARCH_DEFAULTS,
  walletTransactionSearchSchema,
  type WalletTransactionSearchInput,
} from '#/schemas/wallet-transaction-search.schema';

export const Route = createFileRoute('/_app/wallets/$walletId')({
  validateSearch: (search: WalletTransactionSearchInput & SearchSchemaInput) =>
    resolveWalletTransactionSearch(v.parse(walletTransactionSearchSchema, search)),
  search: {
    middlewares: [stripSearchParams(WALLET_TRANSACTION_SEARCH_DEFAULTS)],
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { walletId } = Route.useParams();

  return <WalletPage walletId={walletId} />;
}
