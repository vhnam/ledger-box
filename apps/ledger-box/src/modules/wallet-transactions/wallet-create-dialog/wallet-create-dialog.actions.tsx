import { useCreateWallet } from '#/queries/wallets/wallet.mutations';

export function useCreateWalletDialogActions() {
  const { mutate: createWallet, isPending } = useCreateWallet();

  return { createWallet, isPending };
}
