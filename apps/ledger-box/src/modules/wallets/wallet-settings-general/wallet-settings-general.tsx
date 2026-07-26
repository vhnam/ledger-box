import { Field as FormField, Form } from '@formisch/react';

import { Button } from '@vhnam/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';
import { Spinner } from '@vhnam/ui/components/spinner';

import { useWalletSettingsGeneralActions } from '#/modules/wallets/wallet-settings-general/wallet-settings-general.actions';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

type WalletSettingsGeneralProps = {
  wallet: WalletDto;
};

function WalletSettingsGeneral({ wallet }: WalletSettingsGeneralProps) {
  const { form, updateError, isUpdating, handleUpdateWallet } = useWalletSettingsGeneralActions({ wallet });

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Update the display name for this wallet.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form of={form} onSubmit={(output) => handleUpdateWallet(output)}>
          <FieldGroup>
            <FormField
              of={form}
              path={['name']}
              children={(field) => (
                <Field data-invalid={!!field.errors}>
                  <FieldLabel htmlFor={field.props.name}>Wallet name</FieldLabel>
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

            {updateError && <FieldError>{updateError}</FieldError>}

            <Field className="ml-auto w-fit">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Spinner className="size-4" />}
                {isUpdating ? 'Saving...' : 'Save changes'}
              </Button>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </Card>
  );
}

export { WalletSettingsGeneral };
