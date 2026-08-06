import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { ResponsiveDialog } from '@vhnam/ui/components/responsive-dialog';
import { cn } from '@vhnam/ui/lib/utils';

import { format, toDate } from '@vhnam/utils/date';

import { TransactionDialogHeader } from '#/modules/wallets/wallet-transactions/wallet-transaction-dialog-header';
import type { TransactionDto } from '#/queries/transactions/transaction.dto';
import { useTransactionAttachments } from '#/queries/transactions/transaction.queries';

type WalletTransactionDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDto;
  onEdit: (options?: { returnToDetail?: boolean }) => void;
  onDelete: () => void;
  onOpenAttachments: (options?: { returnToDetail?: boolean }) => void;
};

type DetailRowProps = {
  icon: IconName;
  label: ReactNode;
  value: string;
  className?: string;
};

type AttachmentsDetailRowProps = {
  count: number;
  isLoading: boolean;
  isError: boolean;
  onView: () => void;
  className?: string;
};

function formatTransactionDetailDateTime(date: string) {
  return format(toDate(date), 'MMM d, yyyy • h:mm a');
}

function DetailRow({ icon, label, value, className }: DetailRowProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Icon name={icon} className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
    </div>
  );
}

function AttachmentsDetailRow({ count, isLoading, isError, onView, className }: AttachmentsDetailRowProps) {
  const intl = useIntl();
  const value = isLoading
    ? intl.formatMessage({ id: 'transaction.detail.attachments.loading', defaultMessage: 'Loading...' })
    : isError
      ? intl.formatMessage({ id: 'transaction.detail.attachments.loadFailed', defaultMessage: 'Failed to load' })
      : count === 0
        ? intl.formatMessage({ id: 'transaction.detail.attachments.none', defaultMessage: 'None' })
        : count === 1
          ? intl.formatMessage({ id: 'transaction.detail.attachments.one', defaultMessage: '1 file' })
          : intl.formatMessage(
              { id: 'transaction.detail.attachments.other', defaultMessage: '{count} files' },
              { count },
            );
  const showView = !isLoading && !isError && count > 0;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Icon name="PaperclipIcon" className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          <FormattedMessage id="transaction.detail.attachments" defaultMessage="Attachments" />
        </p>
        <p className="truncate text-sm">{value}</p>
      </div>
      {showView ? (
        <button type="button" onClick={onView} className="shrink-0 text-sm underline underline-offset-4">
          <FormattedMessage id="common.view" defaultMessage="View" />
        </button>
      ) : null}
    </div>
  );
}

type WalletTransactionDetailContentProps = {
  open: boolean;
  transaction: TransactionDto;
  onEdit: () => void;
  onDelete: () => void;
  onOpenAttachments: () => void;
};

function WalletTransactionDetailContent({
  open,
  transaction,
  onEdit,
  onDelete,
  onOpenAttachments,
}: WalletTransactionDetailContentProps) {
  const {
    data,
    isLoading: isAttachmentsLoading,
    isError: isAttachmentsError,
  } = useTransactionAttachments(transaction.walletId, transaction.id, open);

  const attachmentCount = data?.attachments.length ?? 0;

  return (
    <>
      <div className="mt-6 divide-y rounded-xl border bg-muted/30">
        <DetailRow
          icon="CalendarBlankIcon"
          label={<FormattedMessage id="transaction.detail.dateTime" defaultMessage="Date & Time" />}
          value={formatTransactionDetailDateTime(transaction.occurredAt)}
          className="p-4"
        />
        <AttachmentsDetailRow
          count={attachmentCount}
          isLoading={isAttachmentsLoading}
          isError={isAttachmentsError}
          onView={onOpenAttachments}
          className="p-4"
        />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onOpenAttachments}>
          <Icon name="PaperclipIcon" />
          <FormattedMessage id="transaction.detail.attachments" defaultMessage="Attachments" />
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={onEdit}>
          <Icon name="PencilLineIcon" />
          <FormattedMessage id="common.edit" defaultMessage="Edit" />
        </Button>
        <Button type="button" variant="destructive" size="icon-lg" className="shrink-0" onClick={onDelete}>
          <Icon name="TrashIcon" />
          <span className="sr-only">
            <FormattedMessage id="common.delete" defaultMessage="Delete" />
          </span>
        </Button>
      </div>
    </>
  );
}

function WalletTransactionDetailSheet({
  open,
  onOpenChange,
  transaction,
  onEdit,
  onDelete,
  onOpenAttachments,
}: WalletTransactionDetailSheetProps) {
  const intl = useIntl();

  function handleEdit() {
    onOpenChange(false);
    onEdit({ returnToDetail: true });
  }

  function handleDelete() {
    onOpenChange(false);
    onDelete();
  }

  function handleOpenAttachments() {
    onOpenChange(false);
    onOpenAttachments({ returnToDetail: true });
  }

  const header = <TransactionDialogHeader transaction={transaction} onClose={() => onOpenChange(false)} />;

  const content = (
    <WalletTransactionDetailContent
      open={open}
      transaction={transaction}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onOpenAttachments={handleOpenAttachments}
    />
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={intl.formatMessage({ id: 'transaction.detail.title', defaultMessage: 'Transaction details' })}
      description={intl.formatMessage(
        { id: 'transaction.detail.description', defaultMessage: 'Details for {description}' },
        { description: transaction.description },
      )}
      hideTitle
      hideDescription
      showCloseButton={false}
      className="gap-0 overflow-hidden p-0 sm:max-w-md"
      headerClassName="sr-only"
    >
      {header}
      <div className="px-4 pb-4">{content}</div>
    </ResponsiveDialog>
  );
}

export { WalletTransactionDetailSheet };
