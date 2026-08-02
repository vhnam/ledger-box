import { Button } from '@vhnam/ui/components/button';
import { FieldError } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';

import { useDeleteWalletDialogActions } from '#/modules/wallets/wallet-delete-dialog/wallet-delete-dialog.actions';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

type DeleteWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: WalletDto;
};

type DeleteWalletContentProps = {
  wallet: WalletDto;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteWalletContent({ wallet, isPending, error, onCancel, onConfirm }: DeleteWalletContentProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <Icon name="TrashIcon" className="size-6 text-destructive" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Delete wallet?</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">&quot;{wallet.name}&quot;</span> and all of its transactions
          will be permanently removed.
          <br />
          This can&apos;t be undone.
        </p>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex w-full gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" className="flex-1" onClick={onConfirm} disabled={isPending}>
          {isPending ? <Spinner className="size-4" /> : null}
          {isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
}

function DeleteWalletDialog({ open, onOpenChange, wallet }: DeleteWalletDialogProps) {
  const { handleDeleteWallet, isPending, error } = useDeleteWalletDialogActions({ wallet });

  function handleCancel() {
    onOpenChange(false);
  }

  function handleConfirm() {
    handleDeleteWallet(() => {
      onOpenChange(false);
    });
  }

  const content = (
    <DeleteWalletContent
      wallet={wallet}
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
      title="Delete wallet?"
      description={`Confirm deletion of ${wallet.name}`}
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

export { DeleteWalletDialog };
