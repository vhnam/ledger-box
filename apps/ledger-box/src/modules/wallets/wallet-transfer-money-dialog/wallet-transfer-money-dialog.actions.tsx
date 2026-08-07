import { reset, useForm } from '@formisch/react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { toast } from '@vhnam/ui/components/toast';

import {
  transferMoneySchema,
  type TransferMoneyInput,
  type TransferMoneyOutput,
} from '#/schemas/transfer-money.schema';

import { formatErrorMessage } from '#/lib/intl-message';

import type { WalletDto } from '#/queries/wallets/wallet.dto';
import { useTransferMoney } from '#/queries/wallets/wallet.mutations';

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
    occurredAt: undefined,
  };
}

export function useTransferMoneyDialogActions({ open, walletId, wallets }: UseTransferMoneyDialogActionsOptions) {
  const intl = useIntl();
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
    const walletFallback = intl.formatMessage({ id: 'common.walletFallback', defaultMessage: 'Wallet' });

    transferMoney(output, {
      onSuccess: () => {
        toast.add({
          title: intl.formatMessage({ id: 'toast.transfer.completed', defaultMessage: 'Transfer completed' }),
          description: intl.formatMessage(
            { id: 'toast.transfer.completedDescription', defaultMessage: '{fromName} → {toName}' },
            {
              fromName: fromWallet?.name ?? walletFallback,
              toName: toWallet?.name ?? walletFallback,
            },
          ),
          type: 'success',
        });
        onSuccess();
      },
      onError: (transferError) => {
        const message = transferError instanceof Error ? transferError.message : 'transfer.errorFallback';
        setError(message);
        toast.add({
          title: intl.formatMessage({ id: 'toast.transfer.failed', defaultMessage: 'Transfer failed' }),
          description: formatErrorMessage(intl, message),
          type: 'error',
        });
      },
    });
  }

  return { form, handleOpenChange, handleTransfer, isPending, error };
}
