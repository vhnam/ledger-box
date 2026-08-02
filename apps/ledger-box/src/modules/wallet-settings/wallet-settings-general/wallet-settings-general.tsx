import { Field as FormField, Form } from '@formisch/react';
import { useState } from 'react';

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@vhnam/ui/components/alert';
import { Button } from '@vhnam/ui/components/button';
import { Field, FieldError, FieldGroup } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { useWalletSettingsGeneralActions } from '#/modules/wallet-settings/wallet-settings-general/wallet-settings-general.actions';
import { DeleteWalletDialog } from '#/modules/wallets/wallet-delete-dialog';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

type WalletSettingsGeneralProps = {
  wallet: WalletDto;
};

function WalletSettingsGeneral({ wallet }: WalletSettingsGeneralProps) {
  const { form, updateError, isUpdating, handleUpdateWallet } = useWalletSettingsGeneralActions({ wallet });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1 border-b pb-4">
          <h1 className="font-heading text-2xl font-semibold">General</h1>
          <p className="text-sm text-muted-foreground">Rename this wallet or permanently delete it.</p>
        </div>

        <div className="flex flex-col gap-3 border-b pb-8">
          <h2 className="text-base font-semibold">Wallet name</h2>

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
                        placeholder="Enter wallet name"
                        aria-invalid={!!field.errors}
                        {...field.props}
                        value={field.input ?? ''}
                      />
                      {field.errors && <FieldError>{field.errors[0]}</FieldError>}
                    </Field>
                  )}
                />

                <Button type="submit" variant="outline" disabled={isUpdating}>
                  {isUpdating && <Spinner className="size-4" />}
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </div>

              {updateError && <FieldError>{updateError}</FieldError>}
            </FieldGroup>
          </Form>
        </div>

        <div className="flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Danger Zone</h2>
          </div>

          <Alert variant="destructive">
            <AlertTitle>Delete this wallet</AlertTitle>
            <AlertDescription>
              Once you delete a wallet, there is no going back. All of its transactions will be permanently deleted.
            </AlertDescription>
            <AlertAction>
              <Button size="xs" type="button" variant="destructive" onClick={() => setOpenDeleteDialog(true)}>
                Delete wallet
              </Button>
            </AlertAction>
          </Alert>
        </div>
      </div>

      <DeleteWalletDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog} wallet={wallet} />
    </>
  );
}

export { WalletSettingsGeneral };
