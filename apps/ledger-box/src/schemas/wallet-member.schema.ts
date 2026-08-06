import * as v from 'valibot';

import { WALLET_MEMBER_ROLES } from '#/constants/wallet-member-role-options';

export const inviteWalletMemberSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email('validation.member.email.invalid')),
  role: v.picklist([WALLET_MEMBER_ROLES.VIEWER, WALLET_MEMBER_ROLES.MANAGER]),
});

export const updateWalletMemberRoleSchema = v.object({
  role: v.picklist([WALLET_MEMBER_ROLES.VIEWER, WALLET_MEMBER_ROLES.MANAGER]),
});

export type InviteWalletMemberSchema = v.InferOutput<typeof inviteWalletMemberSchema>;
export type UpdateWalletMemberRoleSchema = v.InferOutput<typeof updateWalletMemberRoleSchema>;
