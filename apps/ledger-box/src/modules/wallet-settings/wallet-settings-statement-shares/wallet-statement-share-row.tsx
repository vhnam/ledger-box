import { Badge } from '@vhnam/ui/components/badge';
import { Button, buttonVariants } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';

import { formatDate, formatRelative } from '@vhnam/utils/date';

import { useAppLocale } from '#/lib/locale-context';
import type { StatementShareDto } from '#/queries/statement-shares/statement-share.dto';

type WalletStatementShareRowProps = {
  walletId: string;
  share: StatementShareDto;
  onRevoke: (shareId: string) => void;
};

function getStatusLabel(share: StatementShareDto): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (share.revokedAt) {
    return { label: 'Revoked', variant: 'destructive' };
  }

  if (!share.isActive) {
    return { label: 'Expired', variant: 'secondary' };
  }

  return { label: 'Active', variant: 'default' };
}

function WalletStatementShareRow({ walletId, share, onRevoke }: WalletStatementShareRowProps) {
  const status = getStatusLabel(share);
  const locale = useAppLocale();

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{share.displayTitle ?? 'Account statement'}</p>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(share.periodFrom, undefined, locale)} – {formatDate(share.periodTo, undefined, locale)}
        </p>
        <p className="text-xs text-muted-foreground">
          {share.lastAccessedAt ? `Last viewed ${formatRelative(share.lastAccessedAt, locale)}` : 'Not yet viewed'} ·{' '}
          {share.accessCount} view{share.accessCount === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <a
          href={`/api/wallets/${walletId}/statement-shares/${share.id}/export`}
          download
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <Icon name="DownloadIcon" />
          Download
        </a>
        {share.isActive ? (
          <Button variant="ghost" size="sm" onClick={() => onRevoke(share.id)}>
            <Icon name="ProhibitIcon" />
            Revoke
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export { WalletStatementShareRow };
