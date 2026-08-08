import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vhnam/ui/components/dropdown-menu';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { cn } from '@vhnam/ui/lib/utils';

import { SectionShellLayout } from '#/layouts/section-shell-layout';

import { SettingsHeader } from '#/modules/settings/settings-header';

type SettingsSection = {
  value: 'account' | 'appearance';
  labelId: string;
  defaultLabel: string;
  icon: IconName;
  to: '/settings/account' | '/settings/appearance';
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    value: 'account',
    labelId: 'settings.nav.account',
    defaultLabel: 'Account',
    icon: 'UserCircleIcon',
    to: '/settings/account',
  },
  {
    value: 'appearance',
    labelId: 'settings.nav.appearance',
    defaultLabel: 'Appearance',
    icon: 'DesktopIcon',
    to: '/settings/appearance',
  },
];

function SettingsShellLayout() {
  const intl = useIntl();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const lastSegment = pathname.split('/').filter(Boolean).pop();
  const matchedSection = SETTINGS_SECTIONS.find((section) => section.value === lastSegment)?.value;
  const activeSection = SETTINGS_SECTIONS.find((section) => section.value === matchedSection) ?? SETTINGS_SECTIONS[0];

  useEffect(() => {
    // Only auto-land from the bare /settings index — matchedSection is undefined
    // for any non-settings pathname too (e.g. mid-navigation to /wallets/$walletId),
    // and redirecting then would clobber that navigation.
    if (pathname !== '/settings') {
      return;
    }

    void navigate({ to: '/settings/account', replace: true });
  }, [pathname, navigate]);

  return (
    <SectionShellLayout
      header={<SettingsHeader />}
      bodyClassName="h-[calc(100vh-var(--header-height)-var(--sub-header-height))] md:h-[calc(100vh-var(--header-height))]"
      sidebarClassName="w-64 gap-4 p-2"
      contentClassName="mx-auto max-w-4xl p-4 lg:p-6"
      scrollRestorationId={`settings-${matchedSection ?? 'account'}`}
      sidebar={
        <div className="flex flex-col gap-1">
          <p className="px-3 pt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <FormattedMessage id="settings.page.navLabel" defaultMessage="Settings" />
          </p>
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = section.value === matchedSection;

            return (
              <Button
                key={section.value}
                variant="ghost"
                className={cn('w-full justify-start gap-3 px-3 py-2', isActive && 'bg-accent text-accent-foreground')}
                nativeButton={false}
                render={
                  <Link to={section.to}>
                    <Icon name={section.icon} />
                    <span className="flex-1 text-left">
                      <FormattedMessage id={section.labelId} defaultMessage={section.defaultLabel} />
                    </span>
                  </Link>
                }
              />
            );
          })}
        </div>
      }
      mobileBar={
        <div className="flex w-full items-center justify-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium text-foreground transition-colors">
              <Icon name={activeSection.icon} className="size-4" />
              {intl.formatMessage({
                id: activeSection.labelId,
                defaultMessage: activeSection.defaultLabel,
              })}
              <Icon name="CaretDownIcon" className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
              {SETTINGS_SECTIONS.map((section) => (
                <DropdownMenuItem key={section.value} nativeButton={false} render={<Link to={section.to} />}>
                  <Icon name={section.icon} />
                  <span className="flex-1">
                    <FormattedMessage id={section.labelId} defaultMessage={section.defaultLabel} />
                  </span>
                  {section.value === matchedSection ? (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <Outlet />
    </SectionShellLayout>
  );
}

export { SettingsShellLayout };
