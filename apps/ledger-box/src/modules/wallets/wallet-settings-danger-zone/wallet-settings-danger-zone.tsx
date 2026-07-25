import { useState } from 'react';

import { Button } from '@vhnam/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';

import { DeleteWalletDialog } from '#/modules/wallets/delete-wallet-dialog';
import type { WalletDto } from '#/queries/wallets/wallet.dto';

type WalletSettingsDangerZoneProps = {
  wallet: WalletDto;
};

function WalletSettingsDangerZone({ wallet }: WalletSettingsDangerZoneProps) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  return (
    <>
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete this wallet and all of its transactions. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={() => setOpenDeleteDialog(true)}>
            Delete wallet
          </Button>
        </CardContent>
      </Card>

      <DeleteWalletDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog} wallet={wallet} />
    </>
  );
}

export { WalletSettingsDangerZone };
