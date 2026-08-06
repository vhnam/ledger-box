import { FormattedMessage } from 'react-intl';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@vhnam/ui/components/dialog';
import { DropdownMenuItem } from '@vhnam/ui/components/dropdown-menu';
import { Icon } from '@vhnam/ui/components/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@vhnam/ui/components/tabs';

import { SettingsAccount } from '#/modules/settings/settings-account';
import { SettingsAppearance } from '#/modules/settings/settings-appearance';
import { SettingsLocale } from '#/modules/settings/settings-locale';

const SettingsTab = {
  Account: 'account',
  Appearance: 'appearance',
  Locale: 'locale',
} as const;

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage id="settings.dialog.title" defaultMessage="Settings" />
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-96">
          <Tabs defaultValue={SettingsTab.Appearance} orientation="vertical">
            <TabsList className="bg-transparent">
              <TabsTrigger value={SettingsTab.Account}>
                <FormattedMessage id="settings.dialog.tabs.account" defaultMessage="Account" />
              </TabsTrigger>
              <TabsTrigger value={SettingsTab.Appearance}>
                <FormattedMessage id="settings.dialog.tabs.appearance" defaultMessage="Appearance" />
              </TabsTrigger>
              <TabsTrigger value={SettingsTab.Locale}>
                <FormattedMessage id="settings.dialog.tabs.locale" defaultMessage="Language" />
              </TabsTrigger>
            </TabsList>
            <TabsContent value={SettingsTab.Account}>
              <SettingsAccount />
            </TabsContent>
            <TabsContent value={SettingsTab.Appearance}>
              <SettingsAppearance />
            </TabsContent>
            <TabsContent value={SettingsTab.Locale}>
              <SettingsLocale />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsDialogTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <DropdownMenuItem onClick={onOpen}>
      <Icon name="GearIcon" />
      <FormattedMessage id="settings.dialog.title" defaultMessage="Settings" />
    </DropdownMenuItem>
  );
}

export { SettingsDialog, SettingsDialogTrigger };
