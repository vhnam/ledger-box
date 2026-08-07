import { FormattedMessage, useIntl } from 'react-intl';

import { Badge } from '@vhnam/ui/components/badge';
import { Button, buttonVariants } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';

import { formatDate, formatRelative } from '@vhnam/utils/date';

import { useAppLocale } from '#/lib/locale/locale-context';

import type { StatementShareDto } from '#/queries/statement-shares/statement-share.dto';

type WalletStatementShareRowProps = {
  walletId: string;
  share: StatementShareDto;
  onRevoke: (shareId: string) => void;
};

function getStatusVariant(share: StatementShareDto): 'default' | 'secondary' | 'destructive' {
  if (share.revokedAt) {
    return 'destructive';
  }

  if (!share.isActive) {
    return 'secondary';
  }

  return 'default';
}

function WalletStatementShareRow({ walletId, share, onRevoke }: WalletStatementShareRowProps) {
  const intl = useIntl();
  const locale = useAppLocale();
  const statusVariant = getStatusVariant(share);

  const statusLabel = share.revokedAt
    ? intl.formatMessage({ id: 'wallet.settings.shares.row.status.revoked', defaultMessage: 'Revoked' })
    : !share.isActive
      ? intl.formatMessage({ id: 'wallet.settings.shares.row.status.expired', defaultMessage: 'Expired' })
      : intl.formatMessage({ id: 'wallet.settings.shares.row.status.active', defaultMessage: 'Active' });

  const viewsLabel =
    share.accessCount === 1
      ? intl.formatMessage({ id: 'wallet.settings.shares.row.viewsOne', defaultMessage: '1 view' })
      : intl.formatMessage(
          { id: 'wallet.settings.shares.row.viewsOther', defaultMessage: '{count} views' },
          { count: share.accessCount },
        );

  const lastViewedLabel = share.lastAccessedAt
    ? intl.formatMessage(
        { id: 'wallet.settings.shares.row.lastViewed', defaultMessage: 'Last viewed {relative}' },
        { relative: formatRelative(share.lastAccessedAt, locale) },
      )
    : intl.formatMessage({ id: 'wallet.settings.shares.row.notYetViewed', defaultMessage: 'Not yet viewed' });

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {share.displayTitle ??
              intl.formatMessage({
                id: 'wallet.settings.shares.row.fallbackTitle',
                defaultMessage: 'Account statement',
              })}
          </p>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(share.periodFrom, undefined, locale)} – {formatDate(share.periodTo, undefined, locale)}
        </p>
        <p className="text-xs text-muted-foreground">
          {lastViewedLabel} · {viewsLabel}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <a
          href={`/api/wallets/${walletId}/statement-shares/${share.id}/export`}
          download
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <Icon name="DownloadIcon" />
          <FormattedMessage id="wallet.settings.shares.row.download" defaultMessage="Download" />
        </a>
        {share.isActive ? (
          <Button variant="ghost" size="sm" onClick={() => onRevoke(share.id)}>
            <Icon name="ProhibitIcon" />
            <FormattedMessage id="wallet.settings.shares.row.revoke" defaultMessage="Revoke" />
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export { WalletStatementShareRow };
