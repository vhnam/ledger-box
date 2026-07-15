import { reset, useForm } from '@formisch/react';
import { useEffect, useState } from 'react';

import { toast } from '@vhnam/ui/components/sonner';

import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { useTransferMoney } from '#/queries/wallets/wallet.mutations';
import {
  transferMoneySchema,
  type TransferMoneyInput,
  type TransferMoneyOutput,
} from '#/schemas/transfer-money.schema';

type UseTransferMoneyDialogActionsOptions = {
  open: boolean;
  walletId: string;
  wallets: WalletDto[];
};

function getDefaultInput(walletId: string, wallets: WalletDto[]): TransferMoneyInput {
  const defaultTo = wallets.find((wallet) => wallet.id !== walletId)?.id ?? '';

  return {
    fromWalletId: walletId,
    toWalletId: defaultTo,
    amount: '',
    note: '',
  };
}

export function useTransferMoneyDialogActions({ open, walletId, wallets }: UseTransferMoneyDialogActionsOptions) {
  const form = useForm({ schema: transferMoneySchema });
  const { mutate: transferMoney, isPending } = useTransferMoney();
  const [error, setError] = useState<string | null>(null);
  const walletIds = wallets.map((wallet) => wallet.id).join(',');

  useEffect(() => {
    if (!open || wallets.length === 0) {
      return;
    }

    setError(null);
    reset(form, {
      initialInput: getDefaultInput(walletId, wallets),
    });
  }, [open, walletId, walletIds, wallets, form]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      reset(form);
    }
  }

  function handleTransfer(output: TransferMoneyOutput, onSuccess: () => void) {
    setError(null);

    const fromWallet = wallets.find((wallet) => wallet.id === output.fromWalletId);
    const toWallet = wallets.find((wallet) => wallet.id === output.toWalletId);

    if (fromWallet && output.amount > fromWallet.amount) {
      const message = 'Insufficient balance in source wallet';
      setError(message);
      return;
    }

    transferMoney(output, {
      onSuccess: () => {
        toast.success('Transfer completed', {
          description: `${fromWallet?.name ?? 'Wallet'} → ${toWallet?.name ?? 'wallet'}`,
        });
        onSuccess();
      },
      onError: (transferError) => {
        const message = transferError instanceof Error ? transferError.message : 'Transfer failed. Please try again.';
        setError(message);
        toast.error('Transfer failed', { description: message });
      },
    });
  }

  return { form, handleOpenChange, handleTransfer, isPending, error };
}
