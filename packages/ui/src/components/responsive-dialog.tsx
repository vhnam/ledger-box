import type { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/sheet';
import { useIsMobile } from '#/hooks/use-mobile';
import { cn } from '#/lib/utils';

type DismissReason = DialogPrimitive.Root.ChangeEventReason;

// Reasons that represent an explicit, deliberate close action (close button,
// imperative `.close()` call, or the trigger being pressed again) rather than
// an incidental one (backdrop tap, Escape, focus leaving the popup).
const EXPLICIT_DISMISS_REASONS = new Set<DismissReason>(['close-press', 'imperative-action', 'trigger-press']);

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Visually hide the title (still read by screen readers). Use when the body renders its own heading. */
  hideTitle?: boolean;
  /** Visually hide the description (still read by screen readers). */
  hideDescription?: boolean;
  trigger?: React.ReactElement;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  /**
   * When true, incidental dismissal (backdrop tap, Escape, focus-out) is blocked and
   * `onDismissAttempt` is called instead — the dialog stays open since it's controlled.
   * Use for forms with unsaved input; the caller decides what happens next (e.g. show a
   * "discard changes?" confirmation and call `onOpenChange(false)` if the user confirms).
   * The close button and any other explicit close action always go through.
   */
  preventDismiss?: boolean;
  onDismissAttempt?: () => void;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
}

function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  hideDescription = false,
  trigger,
  children,
  footer,
  showCloseButton = true,
  preventDismiss = false,
  onDismissAttempt,
  className,
  headerClassName,
  titleClassName,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  function handleOpenChange(nextOpen: boolean, eventDetails: { reason?: DismissReason }) {
    if (!nextOpen && preventDismiss && !EXPLICIT_DISMISS_REASONS.has(eventDetails.reason as DismissReason)) {
      onDismissAttempt?.();
      return;
    }
    onOpenChange(nextOpen);
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        {trigger ? <SheetTrigger render={trigger} /> : null}
        <SheetContent
          side="bottom"
          showCloseButton={showCloseButton}
          className={cn('max-h-[85dvh] gap-4 overflow-y-auto rounded-t-2xl px-4 pb-6 pt-2', className)}
        >
          <SheetHeader className={cn('px-0', headerClassName)}>
            <SheetTitle className={cn(hideTitle && 'sr-only', titleClassName)}>{title}</SheetTitle>
            {description ? (
              <SheetDescription className={cn(hideDescription && 'sr-only')}>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
          {children}
          {footer ? <SheetFooter className="px-0 pt-0">{footer}</SheetFooter> : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent showCloseButton={showCloseButton} className={cn('sm:max-w-md', className)}>
        <DialogHeader className={headerClassName}>
          <DialogTitle className={cn(hideTitle && 'sr-only', titleClassName)}>{title}</DialogTitle>
          {description ? (
            <DialogDescription className={cn(hideDescription && 'sr-only')}>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

export { ResponsiveDialog };
export type { ResponsiveDialogProps };
