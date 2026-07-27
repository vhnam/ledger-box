import { Badge } from '@vhnam/ui/components/badge';
import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';

import { formatDate, formatRelative } from '@vhnam/utils/date';

import type { StatementShareDto } from '#/queries/statement-shares/statement-share.dto';

type WalletStatementShareRowProps = {
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

function WalletStatementShareRow({ share, onRevoke }: WalletStatementShareRowProps) {
  const status = getStatusLabel(share);

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{share.displayTitle ?? 'Account statement'}</p>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(share.periodFrom)} – {formatDate(share.periodTo)}
        </p>
        <p className="text-xs text-muted-foreground">
          {share.lastAccessedAt ? `Last viewed ${formatRelative(share.lastAccessedAt)}` : 'Not yet viewed'} ·{' '}
          {share.accessCount} view{share.accessCount === 1 ? '' : 's'}
        </p>
      </div>
      {share.isActive ? (
        <Button variant="ghost" size="sm" onClick={() => onRevoke(share.id)}>
          <Icon name="ProhibitIcon" />
          Revoke
        </Button>
      ) : null}
    </li>
  );
}

export { WalletStatementShareRow };
