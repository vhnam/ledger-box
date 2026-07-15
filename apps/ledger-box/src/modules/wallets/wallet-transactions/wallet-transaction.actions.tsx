import { useCallback, useState, type KeyboardEvent } from 'react';

import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';
import { cn } from '@vhnam/ui/lib/utils';

import type { TransactionDto } from '#/queries/transactions/transaction.dto';

function getTransactionAmountClassName(type: TransactionDto['type'], size: 'sm' | 'xl' = 'sm') {
  return cn(
    'font-mono',
    size === 'sm' ? 'shrink-0 text-sm font-medium flex items-center justify-end' : 'text-3xl font-semibold',
    type === 'income' ? 'text-emerald-500' : 'text-rose-500',
  );
}

function useWalletTransaction() {
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const openEditDialog = useCallback(() => {
    setEditOpen(true);
  }, []);

  const openDeleteDialog = useCallback(() => {
    setDeleteOpen(true);
  }, []);

  const openActionsSheet = useCallback(() => {
    setActionsOpen(true);
  }, []);

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openActionsSheet();
      }
    },
    [openActionsSheet],
  );

  const rowClassName = cn(
    'gap-4 px-4 py-3 border rounded-lg bg-card hover:bg-card/70 hover:border-border/60 transition-all duration-100 select-none',
    isMobile && 'cursor-pointer active:bg-card/50',
  );

  const gridClassName = cn('grid items-center gap-4', isMobile ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_auto_auto]');

  const rowProps = isMobile
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: openActionsSheet,
        onKeyDown: handleRowKeyDown,
      }
    : {};

  return {
    isMobile,
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    actionsOpen,
    setActionsOpen,
    openEditDialog,
    openDeleteDialog,
    rowClassName,
    gridClassName,
    rowProps,
  };
}

export { getTransactionAmountClassName, useWalletTransaction };
