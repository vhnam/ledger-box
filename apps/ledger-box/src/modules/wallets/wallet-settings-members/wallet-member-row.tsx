import { Button } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';

import { WALLET_MEMBER_ROLE_OPTIONS, type WalletMemberRole } from '#/constants/wallet-member-role-options';
import type { WalletMemberDto } from '#/queries/wallets/wallet-member.dto';

import { WalletMemberAvatar } from './wallet-member-avatar';
import { WalletMemberIdentity } from './wallet-member-identity';

type WalletMemberRowProps = {
  member: WalletMemberDto;
  onRoleChange: (memberId: string, role: WalletMemberRole) => void;
  onRemove: (memberId: string) => void;
};

function WalletMemberRow({ member, onRoleChange, onRemove }: WalletMemberRowProps) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <WalletMemberAvatar member={member} />
      <WalletMemberIdentity member={member} />

      <Select
        items={WALLET_MEMBER_ROLE_OPTIONS}
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
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!member.isOwner && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${member.email}`}
          onClick={() => onRemove(member.id)}
        >
          <Icon name="XIcon" />
        </Button>
      )}
    </li>
  );
}

export { WalletMemberRow };
