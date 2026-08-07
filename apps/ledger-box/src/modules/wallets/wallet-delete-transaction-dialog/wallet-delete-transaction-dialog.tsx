import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { FieldError } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

import { useDeleteTransactionDialogActions } from '#/modules/wallets/wallet-delete-transaction-dialog/wallet-delete-transaction-dialog.actions';

type DeleteTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDto;
};

type DeleteTransactionContentProps = {
  transaction: TransactionDto;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteTransactionContent({
  transaction,
  isPending,
  error,
  onCancel,
  onConfirm,
}: DeleteTransactionContentProps) {
  const intl = useIntl();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <Icon name="TrashIcon" className="size-6 text-destructive" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">
          <FormattedMessage id="transaction.delete.title" defaultMessage="Delete transaction?" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="transaction.delete.body"
            defaultMessage='"{description}" will be permanently removed.'
            values={{ description: transaction.description }}
          />
          <br />
          <FormattedMessage id="common.cannotBeUndone" defaultMessage="This can't be undone." />
        </p>
      </div>

      {error ? <FieldError>{formatErrorMessage(intl, error)}</FieldError> : null}

      <div className="flex w-full gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
          <FormattedMessage id="common.cancel" defaultMessage="Cancel" />
        </Button>
        <Button type="button" variant="destructive" className="flex-1" onClick={onConfirm} disabled={isPending}>
          {isPending ? <Spinner className="size-4" /> : null}
          {isPending ? (
            <FormattedMessage id="common.deleting" defaultMessage="Deleting..." />
          ) : (
            <FormattedMessage id="common.delete" defaultMessage="Delete" />
          )}
        </Button>
      </div>
    </div>
  );
}

function DeleteTransactionDialog({ open, onOpenChange, transaction }: DeleteTransactionDialogProps) {
  const intl = useIntl();
  const { handleDeleteTransaction, isPending, error } = useDeleteTransactionDialogActions({ transaction });

  function handleCancel() {
    onOpenChange(false);
  }

  function handleConfirm() {
    handleDeleteTransaction(() => {
      onOpenChange(false);
    });
  }

  const content = (
    <DeleteTransactionContent
      transaction={transaction}
      isPending={isPending}
      error={error}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={intl.formatMessage({ id: 'transaction.delete.title', defaultMessage: 'Delete transaction?' })}
      description={intl.formatMessage(
        { id: 'transaction.delete.description', defaultMessage: 'Confirm deletion of {description}' },
        { description: transaction.description },
      )}
      hideTitle
      hideDescription
      showCloseButton={false}
      headerClassName="sr-only"
      className="sm:max-w-md"
    >
      {content}
    </ResponsiveDialog>
  );
}

export { DeleteTransactionDialog };
