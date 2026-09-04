import { FormattedMessage, useIntl } from 'react-intl';

import { Icon } from '@vhnam/ui/components/icon';
import { Badge } from '@vhnam/ui/components/ui/badge';
import { Button } from '@vhnam/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vhnam/ui/components/ui/dropdown-menu';

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

  const exportBase = `/api/wallets/${walletId}/statement-shares/${share.id}/export`;

  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border bg-card px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
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
          {formatDate(share.periodFrom, undefined, locale)} - {formatDate(share.periodTo, undefined, locale)}
        </p>
        <p className="text-xs text-muted-foreground">
          {lastViewedLabel} · {viewsLabel}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm">
                <Icon name="DownloadIcon" />
                <FormattedMessage id="wallet.settings.shares.row.download" defaultMessage="Download" />
                <Icon name="CaretDownIcon" className="size-3.5 opacity-70" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem nativeButton={false} render={<a href={`${exportBase}?format=csv`} download />}>
                <FormattedMessage id="wallet.settings.shares.row.downloadCsv" defaultMessage="Download CSV" />
              </DropdownMenuItem>
              <DropdownMenuItem nativeButton={false} render={<a href={`${exportBase}?format=pdf`} download />}>
                <FormattedMessage id="wallet.settings.shares.row.downloadPdf" defaultMessage="Download PDF" />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {share.isActive ? (
          <Button variant="destructive" size="sm" onClick={() => onRevoke(share.id)}>
            <Icon name="ProhibitIcon" />
            <FormattedMessage id="wallet.settings.shares.row.revoke" defaultMessage="Revoke" />
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export { WalletStatementShareRow };
