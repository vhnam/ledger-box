import { formatSignedCurrency } from '@vhnam/utils/currency';
import { DateTimeFormat, formatDateTime } from '@vhnam/utils/date';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

import { DeleteTransactionDialog } from '../delete-transaction-dialog';
import { EditTransactionDialog } from '../edit-transaction-dialog';
import { WalletTransactionDetailSheet } from './wallet-transaction-detail-sheet';
import { WalletTransactionMenu } from './wallet-transaction-menu';
import { getTransactionAmountClassName, useWalletTransaction } from './wallet-transaction.actions';

type WalletTransactionProps = {
  transaction: TransactionDto;
};

function WalletTransaction({ transaction }: WalletTransactionProps) {
  const {
    isMobile,
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    actionsOpen,
    setActionsOpen,
    openEditDialog,
    openDeleteDialog,
    rowClassName,
    gridClassName,
    rowProps,
  } = useWalletTransaction();

  return (
    <>
      <div className={rowClassName} {...rowProps}>
        <div className={gridClassName}>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{transaction.description}</p>
            <p className="text-xs font-mono text-muted-foreground">
              {formatDateTime(transaction.createdAt, DateTimeFormat.Numeric)}
            </p>
          </div>
          <p className={getTransactionAmountClassName(transaction.type)}>
            {formatSignedCurrency(transaction.amount, transaction.type)}
          </p>
          {!isMobile && <WalletTransactionMenu onEdit={openEditDialog} onDelete={openDeleteDialog} />}
        </div>
      </div>

      {isMobile && (
        <WalletTransactionDetailSheet
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          transaction={transaction}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      <EditTransactionDialog open={editOpen} onOpenChange={setEditOpen} transaction={transaction} />
      <DeleteTransactionDialog open={deleteOpen} onOpenChange={setDeleteOpen} transaction={transaction} />
    </>
  );
}

export { WalletTransaction };
