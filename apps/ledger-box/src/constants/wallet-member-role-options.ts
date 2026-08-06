export const WALLET_MEMBER_ROLES = {
  VIEWER: 'viewer',
  MANAGER: 'manager',
} as const;

export type WalletMemberRole = (typeof WALLET_MEMBER_ROLES)[keyof typeof WALLET_MEMBER_ROLES];

export const WALLET_MEMBER_ROLE_OPTIONS: {
  value: WalletMemberRole;
  labelId: string;
  defaultLabel: string;
  descriptionId: string;
  defaultDescription: string;
}[] = [
  {
    value: WALLET_MEMBER_ROLES.VIEWER,
    labelId: 'members.role.viewer',
    defaultLabel: 'Viewer',
    descriptionId: 'members.role.viewer.description',
    defaultDescription: 'Can view transactions and balances. Cannot add, edit, or delete.',
  },
  {
    value: WALLET_MEMBER_ROLES.MANAGER,
    labelId: 'members.role.manager',
    defaultLabel: 'Manager',
    descriptionId: 'members.role.manager.description',
    defaultDescription: 'Full access: add, edit, delete transactions and invite others.',
  },
];
