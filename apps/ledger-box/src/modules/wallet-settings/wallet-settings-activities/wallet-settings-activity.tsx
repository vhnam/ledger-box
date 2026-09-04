import { useState } from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

import { CodeBlock } from '@vhnam/ui/components/code-block';
import { Icon } from '@vhnam/ui/components/icon';
import { Badge } from '@vhnam/ui/components/ui/badge';
import { Button } from '@vhnam/ui/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vhnam/ui/components/ui/collapsible';
import { cn } from '@vhnam/ui/lib/cn';

import { formatSignedCurrency } from '@vhnam/utils/currency';
import { formatDateTime } from '@vhnam/utils/date';
import type { SupportedLocale } from '@vhnam/utils/locale';

import type { ActivityLogItemDto } from '#/queries/activity/activity.dto';

const ENTITY_DEFAULTS: Record<string, string> = {
  transaction: 'transaction',
  wallet: 'wallet',
  wallet_member: 'wallet member',
  statement_share: 'statement share',
  transfer: 'transfer',
};

const ACTION_DEFAULTS: Record<string, string> = {
  create: 'Created {entity}',
  update: 'Updated {entity}',
  delete: 'Deleted {entity}',
  transfer: 'Transfer',
  invite: 'Invited member',
  role_change: 'Changed member role',
  revoke: 'Revoked statement share',
  rename: 'Renamed wallet',
  invite_resend: 'Resent invite',
  invite_email_failed: 'Invite email failed',
};

type WalletSettingsActivityProps = {
  item: ActivityLogItemDto;
  currency: string;
  locale: SupportedLocale;
};

function actionLabel(intl: IntlShape, item: ActivityLogItemDto): string {
  const entity = intl.formatMessage({
    id: `activity.entity.${item.entityType}`,
    defaultMessage: ENTITY_DEFAULTS[item.entityType] ?? item.entityType,
  });

  if (item.action === 'create' || item.action === 'update' || item.action === 'delete') {
    return intl.formatMessage(
      {
        id: `activity.action.${item.action}`,
        defaultMessage: ACTION_DEFAULTS[item.action],
      },
      { entity },
    );
  }

  return intl.formatMessage({
    id: `activity.action.${item.action}`,
    defaultMessage: ACTION_DEFAULTS[item.action] ?? item.action,
  });
}

function entitySummary(item: ActivityLogItemDto): string {
  const after = item.after;
  const before = item.before;

  if (item.entityType === 'transaction' || item.entityType === 'transfer') {
    const snapshot = (after ?? before) as { description?: string; amount?: number } | null;
    if (snapshot?.description) {
      return snapshot.description;
    }
  }

  if (item.entityType === 'wallet') {
    const name = (after as { name?: string } | null)?.name ?? (before as { name?: string } | null)?.name;
    if (name) {
      return name;
    }
  }

  if (item.entityType === 'wallet_member') {
    const email = (after as { email?: string } | null)?.email ?? (before as { email?: string } | null)?.email;
    if (email) {
      return email;
    }
  }

  return item.entityId;
}

const WalletSettingsActivity = ({ item, currency, locale }: WalletSettingsActivityProps) => {
  const intl = useIntl();
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      className="gap-4 rounded-lg border bg-card px-4 py-3 transition-all duration-100"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{actionLabel(intl, item)}</p>
            {item.affectsActiveStatementShare ? (
              <Badge variant="secondary">
                <FormattedMessage
                  id="wallet.settings.activities.affectsShare"
                  defaultMessage="Affects shared statement"
                />
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">{entitySummary(item)}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {formatDateTime(item.createdAt, undefined, locale)} · {item.actorEmail}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {item.walletAmountDelta != null && item.walletAmountDelta !== 0 ? (
            <p
              className={cn(
                'font-mono text-sm font-medium',
                item.walletAmountDelta > 0 ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {formatSignedCurrency(
                Math.abs(item.walletAmountDelta),
                item.walletAmountDelta > 0 ? 'income' : 'expense',
                {
                  currency,
                  locale,
                },
              )}
            </p>
          ) : null}
          <CollapsibleTrigger
            render={
              <Button variant="outline" size="sm">
                <Icon name={expanded ? 'CaretUpIcon' : 'CaretDownIcon'} />
                {expanded ? (
                  <FormattedMessage id="wallet.settings.activities.hide" defaultMessage="Hide" />
                ) : (
                  <FormattedMessage id="wallet.settings.activities.details" defaultMessage="Details" />
                )}
              </Button>
            }
          />
        </div>
      </div>
      <CollapsibleContent>
        <CodeBlock
          className="mt-3"
          language="json"
          code={JSON.stringify({ before: item.before, after: item.after }, null, 2)}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export { WalletSettingsActivity };
