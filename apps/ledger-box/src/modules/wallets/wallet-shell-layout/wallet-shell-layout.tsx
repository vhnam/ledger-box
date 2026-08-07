import { Link, Navigate, Outlet, useLocation } from '@tanstack/react-router';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vhnam/ui/components/dropdown-menu';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';
import { cn } from '@vhnam/ui/lib/utils';

import { WALLET_MEMBER_ROLES } from '#/constants/wallet-member-role-options';

import { useWallet, useWallets } from '#/queries/wallets/wallet.queries';

import { SectionShellLayout } from '#/layouts/section-shell-layout';

import { WalletHeader } from '#/modules/wallets/wallet-header';

type WalletShellLayoutProps = {
  walletId: string;
};

type SettingsSection = {
  value: string;
  labelId: string;
  defaultLabel: string;
  icon: IconName;
  to:
    | '/wallets/$walletId/settings/general'
    | '/wallets/$walletId/settings/activity'
    | '/wallets/$walletId/settings/members'
    | '/wallets/$walletId/settings/statement-shares';
  ownerOnly: boolean;
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    value: 'general',
    labelId: 'wallet.shell.settings.general',
    defaultLabel: 'General',
    icon: 'GearSixIcon',
    to: '/wallets/$walletId/settings/general',
    ownerOnly: false,
  },
  {
    value: 'activity',
    labelId: 'wallet.shell.settings.activity',
    defaultLabel: 'Activity',
    icon: 'ClockCounterClockwiseIcon',
    to: '/wallets/$walletId/settings/activity',
    ownerOnly: true,
  },
  {
    value: 'members',
    labelId: 'wallet.shell.settings.members',
    defaultLabel: 'Members',
    icon: 'UsersIcon',
    to: '/wallets/$walletId/settings/members',
    ownerOnly: false,
  },
  {
    value: 'statement-shares',
    labelId: 'wallet.shell.settings.statementShares',
    defaultLabel: 'Statement shares',
    icon: 'ReceiptIcon',
    to: '/wallets/$walletId/settings/statement-shares',
    ownerOnly: false,
  },
];

const SETTINGS_SECTION_VALUES = SETTINGS_SECTIONS.map((section) => section.value);

function WalletShellLayout({ walletId }: WalletShellLayoutProps) {
  const intl = useIntl();
  const { data: wallets } = useWallets();
  const { data: wallet, isPending, isError } = useWallet(walletId);
  const walletPreview = wallet ?? wallets?.find((item) => item.id === walletId);
  const { pathname } = useLocation();

  const lastSegment = pathname.split('/').filter(Boolean).pop();
  const matchedSettingsSection = SETTINGS_SECTION_VALUES.find((value) => value === lastSegment);
  const isSettingsPath = pathname.includes('/settings');

  if (!walletPreview && isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-32 text-default-foreground" />
      </div>
    );
  }

  if (isError || !walletId) {
    return (
      <p className="text-sm text-destructive">
        <FormattedMessage id="wallet.error.loadFailed" defaultMessage="Failed to load wallet." />
      </p>
    );
  }

  if (!walletPreview) {
    return (
      <p className="text-sm text-destructive">
        <FormattedMessage id="wallet.error.notFound" defaultMessage="Wallet not found." />
      </p>
    );
  }

  // Transactions stay open to a viewer; only the settings sub-tree is owner/manager-only.
  if (isSettingsPath && walletPreview.role === WALLET_MEMBER_ROLES.VIEWER) {
    return <Navigate to="/wallets/$walletId" params={{ walletId }} replace />;
  }

  const showSettingsGroup = walletPreview.role !== WALLET_MEMBER_ROLES.VIEWER;
  const visibleSettingsSections = SETTINGS_SECTIONS.filter(
    (section) => !section.ownerOnly || walletPreview.role === 'owner',
  );
  const scrollRestorationId = isSettingsPath ? `wallet-settings-${matchedSettingsSection ?? 'general'}` : 'wallet-main';
  const activeSettingsSection =
    visibleSettingsSections.find((section) => section.value === matchedSettingsSection) ?? visibleSettingsSections[0];

  return (
    <SectionShellLayout
      header={<WalletHeader wallet={walletPreview} />}
      bodyClassName="h-[calc(100vh-var(--header-height))]"
      sidebarClassName="w-64 gap-4 p-2"
      contentClassName="mx-auto max-w-4xl p-4 lg:p-6"
      scrollRestorationId={scrollRestorationId}
      sidebar={
        <>
          <div className="flex flex-col gap-1">
            <p className="px-3 pt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <FormattedMessage id="wallet.shell.groupWallet" defaultMessage="Wallet" />
            </p>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-3 py-2',
                !isSettingsPath && 'bg-accent text-accent-foreground',
              )}
              nativeButton={false}
              render={
                <Link to="/wallets/$walletId" params={{ walletId }}>
                  <Icon name="ListBulletsIcon" />
                  <span className="flex-1 text-left">
                    <FormattedMessage id="wallet.shell.transactions" defaultMessage="Transactions" />
                  </span>
                </Link>
              }
            />
          </div>

          {showSettingsGroup ? (
            <div className="flex flex-col gap-1">
              <p className="px-3 pt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <FormattedMessage id="wallet.shell.groupSettings" defaultMessage="Settings" />
              </p>
              {visibleSettingsSections.map((section) => {
                const isActive = section.value === matchedSettingsSection;

                return (
                  <Button
                    key={section.value}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 px-3 py-2',
                      isActive && 'bg-accent text-accent-foreground',
                    )}
                    nativeButton={false}
                    render={
                      <Link to={section.to} params={{ walletId }}>
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
          ) : null}
        </>
      }
      mobileBar={
        <div className="flex w-full items-center justify-between gap-1">
          <Link
            to="/wallets/$walletId"
            params={{ walletId }}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors',
              !isSettingsPath ? 'text-foreground' : 'text-foreground/60 hover:text-foreground',
            )}
          >
            <Icon name="ListBulletsIcon" className="size-4" />
            <FormattedMessage id="wallet.shell.transactions" defaultMessage="Transactions" />
          </Link>

          {showSettingsGroup && activeSettingsSection ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors',
                  isSettingsPath ? 'text-foreground' : 'text-foreground/60 hover:text-foreground',
                )}
              >
                <Icon name={activeSettingsSection.icon} className="size-4" />
                {intl.formatMessage({
                  id: activeSettingsSection.labelId,
                  defaultMessage: activeSettingsSection.defaultLabel,
                })}
                <Icon name="CaretDownIcon" className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-fit">
                {visibleSettingsSections.map((section) => (
                  <DropdownMenuItem
                    key={section.value}
                    nativeButton={false}
                    render={<Link to={section.to} params={{ walletId }} />}
                  >
                    <Icon name={section.icon} />
                    <span className="flex-1">
                      <FormattedMessage id={section.labelId} defaultMessage={section.defaultLabel} />
                    </span>
                    {section.value === matchedSettingsSection ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      }
    >
      <Outlet />
    </SectionShellLayout>
  );
}

export { WalletShellLayout };
