export const WALLET_MEMBER_ROLES = {
  VIEWER: 'viewer',
  MANAGER: 'manager',
} as const;

export type WalletMemberRole = (typeof WALLET_MEMBER_ROLES)[keyof typeof WALLET_MEMBER_ROLES];

export const WALLET_MEMBER_ROLE_OPTIONS: { value: WalletMemberRole; label: string }[] = [
  { value: WALLET_MEMBER_ROLES.VIEWER, label: 'Viewer' },
  { value: WALLET_MEMBER_ROLES.MANAGER, label: 'Manager' },
];

export const WALLET_MEMBER_ROLE_DESCRIPTIONS: Record<WalletMemberRole, string> = {
  [WALLET_MEMBER_ROLES.VIEWER]: 'Can view transactions and balances. Cannot add, edit, or delete.',
  [WALLET_MEMBER_ROLES.MANAGER]: 'Full access: add, edit, delete transactions and invite others.',
};
