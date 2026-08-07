import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { FieldError } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/intl-message';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

import { useDeleteWalletDialogActions } from '#/modules/wallets/wallet-delete-dialog/wallet-delete-dialog.actions';

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
  const intl = useIntl();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <Icon name="TrashIcon" className="size-6 text-destructive" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">
          <FormattedMessage id="wallet.delete.title" defaultMessage="Delete wallet?" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="wallet.delete.body"
            defaultMessage='"{name}" and all of its transactions will be permanently removed.'
            values={{ name: wallet.name }}
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

function DeleteWalletDialog({ open, onOpenChange, wallet }: DeleteWalletDialogProps) {
  const intl = useIntl();
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
      title={intl.formatMessage({ id: 'wallet.delete.title', defaultMessage: 'Delete wallet?' })}
      description={intl.formatMessage(
        { id: 'wallet.delete.description', defaultMessage: 'Confirm deletion of {name}' },
        { name: wallet.name },
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

export { DeleteWalletDialog };
