import { useCallback, useState } from 'react';

import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';
import { cn } from '@vhnam/ui/lib/cn';

export const useWalletTransaction = () => {
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const openEditDialog = useCallback(() => {
    setEditOpen(true);
  }, []);

  const openDeleteDialog = useCallback(() => {
    setDeleteOpen(true);
  }, []);

  const rowClassName =
    'block gap-4 px-4 py-3 border rounded-lg bg-card hover:bg-card/70 hover:border-border/60 transition-all duration-100 select-none cursor-pointer active:bg-card/50';

  const gridClassName = cn('grid items-center gap-4', isMobile ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_auto_auto]');

  return {
    isMobile,
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    openEditDialog,
    openDeleteDialog,
    rowClassName,
    gridClassName,
  };
};
