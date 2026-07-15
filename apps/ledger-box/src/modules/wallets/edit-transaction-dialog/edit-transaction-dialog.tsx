import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@vhnam/ui/components/dialog';
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
}

function EditTransactionDialog({ open, onOpenChange, transaction }: EditTransactionDialogProps) {
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

  const formContent = <EditTransactionForm form={form} onSubmit={handleSubmit} isPending={isPending} error={error} />;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleDialogOpenChange}>
        <SheetContent side="bottom" className="gap-4 rounded-t-2xl px-4 pb-6 pt-2">
          <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="gap-1 p-0">
            <SheetTitle>Edit Transaction</SheetTitle>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

export { EditTransactionDialog };
