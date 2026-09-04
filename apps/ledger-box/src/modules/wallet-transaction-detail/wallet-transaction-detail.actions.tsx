import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

function useWalletTransactionDetail(transaction: TransactionDto) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDeleted() {
    void navigate({ to: '/wallets/$walletId', params: { walletId: transaction.walletId } });
  }

  return {
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    handleDeleted,
  };
}

export { useWalletTransactionDetail };
