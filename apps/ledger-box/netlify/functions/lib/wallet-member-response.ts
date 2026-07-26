import type { WalletMemberRole, WalletMemberStatus } from '#/lib/db/schema.ts';

import type { UserRow } from './user-lookup.ts';

type WalletMemberResponse = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  userId?: string;
  role: WalletMemberRole;
  status: WalletMemberStatus;
  isOwner: boolean;
};

function mapOwnerMember(user: UserRow): WalletMemberResponse {
  const name = user.name?.trim() || undefined;

  return {
    id: user.id,
    email: user.email,
    name,
    image: user.image ?? undefined,
    userId: user.id,
    role: 'manager',
    status: 'active',
    isOwner: true,
  };
}

function mapWalletMember(
  member: {
    id: string;
    email: string;
    userId: string | null;
    role: WalletMemberRole;
    status: WalletMemberStatus;
  },
  user?: UserRow,
): WalletMemberResponse {
  const name = user?.name?.trim() || undefined;

  return {
    id: member.id,
    email: member.email,
    name,
    image: user?.image ?? undefined,
    userId: member.userId ?? user?.id ?? undefined,
    role: member.role,
    status: member.status,
    isOwner: false,
  };
}

export { mapOwnerMember, mapWalletMember, type WalletMemberResponse };
