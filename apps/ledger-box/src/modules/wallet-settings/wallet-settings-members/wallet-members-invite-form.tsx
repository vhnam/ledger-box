import { Button } from '@vhnam/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Input } from '@vhnam/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';
import { Spinner } from '@vhnam/ui/components/spinner';

import {
  WALLET_MEMBER_ROLE_DESCRIPTIONS,
  WALLET_MEMBER_ROLE_OPTIONS,
  type WalletMemberRole,
} from '#/constants/wallet-member-role-options';

type WalletMembersInviteFormProps = {
  inviteEmail: string;
  inviteRole: WalletMemberRole;
  inviteError: string | null;
  isInviting: boolean;
  onInviteEmailChange: (email: string) => void;
  onInviteRoleChange: (role: WalletMemberRole) => void;
  onInvite: () => void;
};

function WalletMembersInviteForm({
  inviteEmail,
  inviteRole,
  inviteError,
  isInviting,
  onInviteEmailChange,
  onInviteRoleChange,
  onInvite,
}: WalletMembersInviteFormProps) {
  return (
    <Field>
      <FieldLabel>Invite by email</FieldLabel>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          type="email"
          placeholder="colleague@email.com"
          value={inviteEmail}
          onChange={(event) => onInviteEmailChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onInvite();
            }
          }}
          className="sm:flex-1"
          aria-invalid={!!inviteError}
          disabled={isInviting}
        />

        <Select
          items={WALLET_MEMBER_ROLE_OPTIONS}
          value={inviteRole}
          onValueChange={(value) => onInviteRoleChange(value as WalletMemberRole)}
          disabled={isInviting}
        >
          <SelectTrigger className="w-full sm:w-32">
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

        <Button type="button" variant="secondary" onClick={onInvite} className="w-full sm:w-auto" disabled={isInviting}>
          {isInviting ? <Spinner className="size-4" /> : <Icon name="PlusIcon" />}
          Invite
        </Button>
      </div>
      {inviteError && <FieldError>{inviteError}</FieldError>}
      <FieldDescription className="space-y-1">
        {WALLET_MEMBER_ROLE_OPTIONS.map((option) => (
          <span key={option.value} className="block">
            <span className="font-medium text-foreground">{option.label}</span>
            {' — '}
            {WALLET_MEMBER_ROLE_DESCRIPTIONS[option.value]}
          </span>
        ))}
      </FieldDescription>
    </Field>
  );
}

export { WalletMembersInviteForm };
