import type { ReactNode } from 'react';

import { ScrollArea } from '@vhnam/ui/components/scroll-area';
import { cn } from '@vhnam/ui/lib/utils';

type SectionShellLayoutProps = {
  /** Optional chrome above the two-column body (e.g. wallet page header). */
  header?: ReactNode;
  /** Optional top row inside the body (e.g. settings SETTINGS + title strip). */
  toolbar?: ReactNode;
  /** Desktop left rail content. */
  sidebar: ReactNode;
  /** Mobile-only bar above the scroll region. */
  mobileBar?: ReactNode;
  /** Classes for the body that wraps toolbar + columns. */
  bodyClassName?: string;
  /** Classes for the desktop sidebar column. */
  sidebarClassName?: string;
  /** Classes for the scroll content wrapper around children. */
  contentClassName?: string;
  scrollRestorationId: string;
  children: ReactNode;
};

/**
 * Shared two-panel section chrome: optional header/toolbar, desktop sidebar,
 * mobile bar, and a scrollable content outlet. Domain nav and copy stay in callers.
 */
function SectionShellLayout({
  header,
  toolbar,
  sidebar,
  mobileBar,
  bodyClassName,
  sidebarClassName,
  contentClassName,
  scrollRestorationId,
  children,
}: SectionShellLayoutProps) {
  return (
    <>
      {header}
      <div className={cn('flex w-full flex-col', bodyClassName)}>
        {toolbar}
        <div className="flex min-h-0 flex-1 md:flex-row">
          <aside
            className={cn(
              'hidden h-full shrink-0 flex-col overflow-y-auto border-r bg-[color-mix(in_oklch,var(--sidebar),var(--background)_50%)] md:flex',
              sidebarClassName,
            )}
          >
            {sidebar}
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {mobileBar ? (
              <div className="flex h-(--sub-header-height) items-center border-b px-2 md:hidden">{mobileBar}</div>
            ) : null}

            <ScrollArea scrollRestorationId={scrollRestorationId} className="h-full w-full">
              <div className={contentClassName}>{children}</div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}

export { SectionShellLayout };
export type { SectionShellLayoutProps };
