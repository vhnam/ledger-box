import { Button } from '@vhnam/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@vhnam/ui/components/dialog';
import { Icon } from '@vhnam/ui/components/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@vhnam/ui/components/sheet';
import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import type { EditTransactionOutput } from '#/schemas/edit-transaction.schema';

import { useEditTransactionDialogActions } from './edit-transaction-dialog.actions';
import { EditTransactionForm } from './edit-transaction-form';

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDto;
  onBack?: () => void;
}

function EditTransactionDialog({ open, onOpenChange, transaction, onBack }: EditTransactionDialogProps) {
  const isMobile = useIsMobile();
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

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleDialogOpenChange}>
        <SheetContent side="bottom" className="gap-4 rounded-t-2xl px-4 pb-6 pt-2">
          <SheetHeader className="flex-row items-center gap-2 py-1 px-0">
            <SheetTitle className="flex items-center gap-2">{headerTitle}</SheetTitle>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-2">
          <DialogTitle className="flex items-center gap-2">{headerTitle}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

export { EditTransactionDialog };
