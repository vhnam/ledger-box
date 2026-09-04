import { FormattedMessage } from 'react-intl';

function TransactionAttachmentEmptyState() {
  return (
    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
      <FormattedMessage id="attachment.empty.title" defaultMessage="No attachments" />
    </div>
  );
}

export { TransactionAttachmentEmptyState };
