import { Badge } from '@vhnam/ui/components/badge';

import { hasRegisteredWalletMember } from '#/modules/wallets/wallet-settings-members/wallet-member.utils';
import type { WalletMemberDto } from '#/queries/wallets/wallet-member.dto';

type WalletMemberIdentityProps = {
  member: WalletMemberDto;
};

function WalletMemberIdentity({ member }: WalletMemberIdentityProps) {
  const hasRegisteredAccount = hasRegisteredWalletMember(member);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2">
        {hasRegisteredAccount ? (
          <span className="truncate text-sm font-medium">{member.name}</span>
        ) : (
          <p className="truncate text-sm">{member.email}</p>
        )}
        {member.isOwner && (
          <Badge
            variant="secondary"
            className="border-transparent bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/15"
          >
            Owner
          </Badge>
        )}
      </div>
      {hasRegisteredAccount && <span className="truncate text-xs text-muted-foreground">{member.email}</span>}
      {member.status === 'pending' && (
        <Badge
          variant="secondary"
          className="mt-1 border-transparent bg-amber-500/15 text-amber-600 hover:bg-amber-500/15 dark:text-amber-400"
        >
          Pending invite
        </Badge>
      )}
    </div>
  );
}

export { WalletMemberIdentity };
