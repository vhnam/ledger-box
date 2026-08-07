import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { FieldError } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/intl-message';
import { useDisconnectGoogleDialogActions } from '#/modules/settings/settings-account/settings-account-disconnect-google-dialog.actions';

type DisconnectGoogleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string | undefined;
};

type DisconnectGoogleContentProps = {
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function DisconnectGoogleContent({ isPending, error, onCancel, onConfirm }: DisconnectGoogleContentProps) {
  const intl = useIntl();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <Icon name="ProhibitIcon" className="size-6 text-destructive" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">
          <FormattedMessage id="settings.account.google.disconnect.title" defaultMessage="Disconnect Google?" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="settings.account.google.disconnect.body"
            defaultMessage="You won't be able to sign in with your Google account anymore. You can reconnect it at any time."
          />
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
            <FormattedMessage id="settings.account.google.disconnecting" defaultMessage="Disconnecting..." />
          ) : (
            <FormattedMessage id="settings.account.google.disconnect.cta" defaultMessage="Disconnect" />
          )}
        </Button>
      </div>
    </div>
  );
}

function DisconnectGoogleDialog({ open, onOpenChange, accountId }: DisconnectGoogleDialogProps) {
  const intl = useIntl();
  const { handleDisconnectGoogle, isPending, error } = useDisconnectGoogleDialogActions({ accountId });

  function handleCancel() {
    onOpenChange(false);
  }

  function handleConfirm() {
    handleDisconnectGoogle(() => {
      onOpenChange(false);
    });
  }

  const content = (
    <DisconnectGoogleContent isPending={isPending} error={error} onCancel={handleCancel} onConfirm={handleConfirm} />
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={intl.formatMessage({
        id: 'settings.account.google.disconnect.title',
        defaultMessage: 'Disconnect Google?',
      })}
      description={intl.formatMessage({
        id: 'settings.account.google.disconnect.body',
        defaultMessage:
          "You won't be able to sign in with your Google account anymore. You can reconnect it at any time.",
      })}
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

export { DisconnectGoogleDialog };
