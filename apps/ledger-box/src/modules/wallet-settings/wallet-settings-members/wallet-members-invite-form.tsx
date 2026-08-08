import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Field, FieldDescription, FieldError } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Input } from '@vhnam/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';
import { Spinner } from '@vhnam/ui/components/spinner';

import { WALLET_MEMBER_ROLE_OPTIONS, type WalletMemberRole } from '#/constants/wallet-member-role-options';

import { formatErrorMessage } from '#/lib/locale/intl-message';

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
    <Field>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          type="email"
          placeholder={intl.formatMessage({
            id: 'wallet.settings.members.invite.placeholder',
            defaultMessage: 'colleague@email.com',
          })}
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
          items={roleItems}
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
                <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="secondary" onClick={onInvite} className="w-full sm:w-auto" disabled={isInviting}>
          {isInviting ? <Spinner className="size-4" /> : <Icon name="PlusIcon" />}
          <FormattedMessage id="wallet.settings.members.invite.submit" defaultMessage="Invite" />
        </Button>
      </div>
      {inviteError && <FieldError>{formatErrorMessage(intl, inviteError)}</FieldError>}
      <FieldDescription className="space-y-1">
        {WALLET_MEMBER_ROLE_OPTIONS.map((option) => (
          <span key={option.value} className="block">
            <span className="font-medium text-foreground">
              <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
            </span>
            {' — '}
            <FormattedMessage id={option.descriptionId} defaultMessage={option.defaultDescription} />
          </span>
        ))}
      </FieldDescription>
    </Field>
  );
}

export { WalletMembersInviteForm };
