import { Link } from '@tanstack/react-router';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { DateTimeFormat, formatDateTime } from '@vhnam/utils/date';

import { getTransactionAmountClassName } from '#/utils/transaction/transaction-amount';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useWallets } from '#/queries/wallets/wallet.queries';

import { useWalletTransaction } from './wallet-transaction.actions';

type WalletTransactionProps = {
  transaction: TransactionDto;
};

function WalletTransaction({ transaction }: WalletTransactionProps) {
  const { data: wallets = [] } = useWallets();
  const currency = wallets.find((wallet) => wallet.id === transaction.walletId)?.currency ?? 'VND';
  const locale = useAppLocale();
  const { rowClassName, gridClassName } = useWalletTransaction();

  return (
    <>
      <Link
        to="/wallets/$walletId/transactions/$transactionId"
        params={{ walletId: transaction.walletId, transactionId: transaction.id }}
        className={rowClassName}
      >
        <div className={gridClassName}>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{transaction.description}</p>
            <p className="text-xs font-mono text-muted-foreground">
              {formatDateTime(transaction.occurredAt, DateTimeFormat.Numeric, locale)}
            </p>
          </div>
          <p className={getTransactionAmountClassName(transaction.type)}>
            {formatSignedCurrency(transaction.amount, transaction.type, { currency, locale })}
          </p>
        </div>
      </Link>
    </>
  );
}

export { WalletTransaction };
