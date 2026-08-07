import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';

import { WALLET_MEMBER_ROLE_OPTIONS, type WalletMemberRole } from '#/constants/wallet-member-role-options';

import type { WalletMemberDto } from '#/queries/wallets/wallet-member.dto';

import { WalletMemberAvatar } from '#/modules/wallet-settings/wallet-settings-members/wallet-member-avatar';
import { WalletMemberIdentity } from '#/modules/wallet-settings/wallet-settings-members/wallet-member-identity';

type WalletMemberRowProps = {
  member: WalletMemberDto;
  onRoleChange: (memberId: string, role: WalletMemberRole) => void;
  onRemove: (memberId: string) => void;
  onResend: (memberId: string) => void;
};

function WalletMemberRow({ member, onRoleChange, onRemove, onResend }: WalletMemberRowProps) {
  const intl = useIntl();

  const roleItems = useMemo(
    () =>
      WALLET_MEMBER_ROLE_OPTIONS.map((option) => ({
        value: option.value,
        label: intl.formatMessage({ id: option.labelId, defaultMessage: option.defaultLabel }),
      })),
    [intl],
  );

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <WalletMemberAvatar member={member} />
      <WalletMemberIdentity member={member} />

      <Select
        items={roleItems}
        value={member.role}
        disabled={member.isOwner}
        onValueChange={(value) => onRoleChange(member.id, value as WalletMemberRole)}
      >
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WALLET_MEMBER_ROLE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {member.status === 'pending' && !member.isOwner && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={intl.formatMessage(
            { id: 'wallet.settings.members.resendAria', defaultMessage: 'Resend invite to {email}' },
            { email: member.email },
          )}
          onClick={() => onResend(member.id)}
        >
          <Icon name="ArrowClockwiseIcon" />
        </Button>
      )}

      {!member.isOwner && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={intl.formatMessage(
            { id: 'wallet.settings.members.removeAria', defaultMessage: 'Remove {email}' },
            { email: member.email },
          )}
          onClick={() => onRemove(member.id)}
        >
          <Icon name="XIcon" />
        </Button>
      )}
    </li>
  );
}

export { WalletMemberRow };
