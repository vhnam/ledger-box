import { isDirty } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';

import { useEditTransactionDialogActions } from '#/modules/wallets/wallet-edit-transaction-dialog/wallet-edit-transaction-dialog.actions';
import { EditTransactionForm } from '#/modules/wallets/wallet-edit-transaction-dialog/wallet-edit-transaction-form';
import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import type { EditTransactionOutput } from '#/schemas/edit-transaction.schema';

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDto;
  onBack?: () => void;
}

function EditTransactionDialog({ open, onOpenChange, transaction, onBack }: EditTransactionDialogProps) {
  const { form, handleOpenChange, handleEditTransaction, isPending, error } = useEditTransactionDialogActions({
    open,
    transaction,
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    handleOpenChange(nextOpen);
    onOpenChange(nextOpen);
  }

  function handleSubmit(output: EditTransactionOutput) {
    handleEditTransaction(output, () => {
      handleDialogOpenChange(false);
    });
  }

  function handleBack() {
    onBack?.();
    handleDialogOpenChange(false);
  }

  function handleDismissAttempt() {
    if (window.confirm('Discard these changes? Your edits will be lost.')) {
      handleDialogOpenChange(false);
    }
  }

  const headerTitle = (
    <>
      {onBack && (
        <Button type="button" variant="ghost" size="icon-sm" className="-ml-1 shrink-0" onClick={handleBack}>
          <Icon name="ArrowLeftIcon" />
          <span className="sr-only">Back</span>
        </Button>
      )}
      <span>Edit Transaction</span>
    </>
  );

  const formContent = <EditTransactionForm form={form} onSubmit={handleSubmit} isPending={isPending} error={error} />;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      title={headerTitle}
      titleClassName="flex items-center gap-2"
      headerClassName="flex-row items-center gap-2 px-0 py-1"
      className="sm:max-w-md"
      preventDismiss={isDirty(form)}
      onDismissAttempt={handleDismissAttempt}
    >
      {formContent}
    </ResponsiveDialog>
  );
}

export { EditTransactionDialog };
