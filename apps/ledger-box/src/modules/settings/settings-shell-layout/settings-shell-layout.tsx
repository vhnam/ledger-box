import { Link, Outlet, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { useIsMobile } from '@vhnam/ui/hooks/use-mobile';
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

function SettingsBackLink({ onClick }: { onClick?: () => void }) {
  const router = useRouter();

  function handleBack() {
    if (onClick) {
      onClick();
      return;
    }

    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({ to: '/wallets' });
  }

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={handleBack}>
      <Icon name="ArrowLeftIcon" className="size-4" />
      <FormattedMessage id="settings.back" defaultMessage="Back" />
    </Button>
  );
}

function SettingsMobileList() {
  return (
    <div className="flex flex-col gap-1 p-2">
      {SETTINGS_SECTIONS.map((section) => (
        <Link
          key={section.value}
          to={section.to}
          className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <Icon name={section.icon} />
          <span className="flex-1 text-left">
            <FormattedMessage id={section.labelId} defaultMessage={section.defaultLabel} />
          </span>
          <Icon name="CaretRightIcon" className="size-4 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

function SettingsShellLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const lastSegment = pathname.split('/').filter(Boolean).pop();
  const matchedSection = SETTINGS_SECTIONS.find((section) => section.value === lastSegment)?.value;
  const isMobileListVisible = matchedSection === undefined;

  useEffect(() => {
    // Only auto-land from the bare /settings index — matchedSection is undefined
    // for any non-settings pathname too (e.g. mid-navigation to /wallets/$walletId),
    // and redirecting then would clobber that navigation.
    if (pathname !== '/settings' || isMobile) {
      return;
    }

    // useIsMobile is false until measured — confirm desktop before auto-landing.
    if (window.matchMedia('(max-width: 767px)').matches) {
      return;
    }

    void navigate({ to: '/settings/account', replace: true });
  }, [isMobile, pathname, navigate]);

  function handleMobileSectionBack() {
    void navigate({ to: '/settings' });
  }

  return (
    <SectionShellLayout
      header={<SettingsHeader />}
      bodyClassName="h-[calc(100vh-var(--header-height))]"
      sidebarClassName="w-64 gap-4 p-2"
      scrollRestorationId={`settings-${matchedSection ?? 'list'}`}
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
        <div className="flex items-center gap-1">
          {isMobileListVisible ? <SettingsBackLink /> : <SettingsBackLink onClick={handleMobileSectionBack} />}
          <p className="text-sm font-medium">
            <FormattedMessage id="settings.page.title" defaultMessage="Settings" />
          </p>
        </div>
      }
    >
      {isMobileListVisible ? (
        <div className="md:hidden">
          <SettingsMobileList />
        </div>
      ) : null}
      <div className={cn('mx-auto max-w-4xl p-4 lg:p-6', isMobileListVisible && 'hidden md:block')}>
        <Outlet />
      </div>
    </SectionShellLayout>
  );
}

export { SettingsShellLayout };
