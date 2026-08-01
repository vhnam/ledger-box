import { Avatar, AvatarFallback, AvatarImage } from '@vhnam/ui/components/avatar';

import { getAvatarFallbackFromEmail, getAvatarFallbackFromName } from '#/lib/avatar';
import { hasRegisteredWalletMember } from '#/modules/wallet-settings/wallet-settings-members/wallet-member.utils';
import type { WalletMemberDto } from '#/queries/wallets/wallet-member.dto';

type WalletMemberAvatarProps = {
  member: WalletMemberDto;
};

function WalletMemberAvatar({ member }: WalletMemberAvatarProps) {
  const hasRegisteredAccount = hasRegisteredWalletMember(member);
  const fallback = hasRegisteredAccount
    ? getAvatarFallbackFromName(member.name ?? '')
    : getAvatarFallbackFromEmail(member.email);

  return (
    <Avatar size="sm">
      {member.image && <AvatarImage src={member.image} alt={member.name ?? member.email} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

export { WalletMemberAvatar };
