import { Field as FormField, Form } from '@formisch/react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldError, FieldGroup } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/locale/intl-message';

import type { WalletDto } from '#/queries/wallets/wallet.dto';

import { useWalletSettingsGeneralActions } from '#/modules/wallet-settings/wallet-settings-general/wallet-settings-general.actions';
import { DeleteWalletDialog } from '#/modules/wallets/wallet-delete-dialog';

type WalletSettingsGeneralProps = {
  wallet: WalletDto;
};

function WalletSettingsGeneral({ wallet }: WalletSettingsGeneralProps) {
  const intl = useIntl();
  const { form, updateError, isUpdating, handleUpdateWallet } = useWalletSettingsGeneralActions({ wallet });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1 border-b pb-4">
          <h1 className="font-heading text-2xl font-semibold">
            <FormattedMessage id="wallet.settings.general.title" defaultMessage="General" />
          </h1>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              id="wallet.settings.general.description"
              defaultMessage="Manage this wallet's name, currency, and deletion."
            />
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <FormattedMessage id="wallet.settings.general.name.heading" defaultMessage="Wallet name" />
            </CardTitle>
            <CardDescription>
              <FormattedMessage
                id="wallet.settings.general.name.description"
                defaultMessage="This is the display name for this wallet."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form of={form} onSubmit={(output) => handleUpdateWallet(output)}>
              <FieldGroup>
                <div className="flex items-start gap-2">
                  <FormField
                    of={form}
                    path={['name']}
                    children={(field) => (
                      <Field className="flex-1" data-invalid={!!field.errors}>
                        <Input
                          id={field.props.name}
                          placeholder={intl.formatMessage({
                            id: 'wallet.settings.general.name.placeholder',
                            defaultMessage: 'Enter wallet name',
                          })}
                          aria-invalid={!!field.errors}
                          {...field.props}
                          value={field.input ?? ''}
                        />
                        {field.errors && <FieldError>{formatErrorMessage(intl, field.errors[0])}</FieldError>}
                      </Field>
                    )}
                  />

                  <Button type="submit" variant="outline" disabled={isUpdating}>
                    {isUpdating && <Spinner className="size-4" />}
                    {isUpdating ? (
                      <FormattedMessage id="wallet.settings.general.saving" defaultMessage="Saving..." />
                    ) : (
                      <FormattedMessage id="wallet.settings.general.save" defaultMessage="Save" />
                    )}
                  </Button>
                </div>

                {updateError && <FieldError>{formatErrorMessage(intl, updateError)}</FieldError>}
              </FieldGroup>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <FormattedMessage id="wallet.settings.general.currency.heading" defaultMessage="Currency" />
            </CardTitle>
            <CardDescription>
              <FormattedMessage
                id="wallet.settings.general.currency.description"
                defaultMessage="This is the currency of this wallet."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input value={wallet.currency} disabled readOnly />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              <FormattedMessage id="wallet.settings.general.dangerZone" defaultMessage="Danger Zone" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              <FormattedMessage
                id="wallet.settings.general.delete.body"
                defaultMessage="Once you delete a wallet, there is no going back. All of its transactions will be permanently deleted."
              />
            </p>
            <div>
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setOpenDeleteDialog(true)}
              >
                <FormattedMessage id="wallet.settings.general.delete.cta" defaultMessage="Delete wallet" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteWalletDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog} wallet={wallet} />
    </>
  );
}

export { WalletSettingsGeneral };
