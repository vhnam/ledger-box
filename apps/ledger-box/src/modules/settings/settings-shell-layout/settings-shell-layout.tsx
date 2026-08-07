import { Link, Outlet, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { ScrollArea } from '@vhnam/ui/components/scroll-area';
import { cn } from '@vhnam/ui/lib/utils';

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
    icon: 'UserIcon',
    to: '/settings/account',
  },
  {
    value: 'appearance',
    labelId: 'settings.nav.appearance',
    defaultLabel: 'Appearance',
    icon: 'PaletteIcon',
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

function SettingsMobileList({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {SETTINGS_SECTIONS.map((section) => (
        <Link
          key={section.value}
          to={section.to}
          onClick={onSelect}
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
  const [mobileSectionOpened, setMobileSectionOpened] = useState(false);

  const lastSegment = pathname.split('/').filter(Boolean).pop();
  const matchedSection = SETTINGS_SECTIONS.find((section) => section.value === lastSegment)?.value;
  const isMobileListVisible = matchedSection === 'account' && !mobileSectionOpened;

  function handleMobileSectionBack() {
    if (matchedSection !== 'account') {
      void navigate({ to: '/settings/account' });
    }

    setMobileSectionOpened(false);
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] w-full md:flex-row">
      <div className="hidden shrink-0 flex-col gap-4 p-2 md:flex md:h-full md:w-64 md:border-r">
        <div className="flex items-center gap-1 px-1 pt-2">
          <SettingsBackLink />
        </div>
        <div className="flex flex-col gap-1">
          <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <FormattedMessage id="settings.page.title" defaultMessage="Settings" />
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
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-(--sub-header-height) items-center gap-1 border-b px-2 md:hidden">
          {isMobileListVisible ? <SettingsBackLink /> : <SettingsBackLink onClick={handleMobileSectionBack} />}
          <p className="text-sm font-medium">
            <FormattedMessage id="settings.page.title" defaultMessage="Settings" />
          </p>
        </div>

        <ScrollArea scrollRestorationId={`settings-${matchedSection ?? 'account'}`} className="h-full w-full">
          {isMobileListVisible ? (
            <div className="md:hidden">
              <SettingsMobileList onSelect={() => setMobileSectionOpened(true)} />
            </div>
          ) : null}
          <div className={cn('mx-auto max-w-4xl p-4 lg:p-6', isMobileListVisible && 'hidden md:block')}>
            <Outlet />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export { SettingsShellLayout };
