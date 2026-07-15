import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@vhnam/ui/components/dialog';
import { DropdownMenuItem } from '@vhnam/ui/components/dropdown-menu';
import { Icon } from '@vhnam/ui/components/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@vhnam/ui/components/tabs';

import { SettingsAccount } from '../settings-account';
import { SettingsAppearance } from '../settings-appearance';

const SettingsTab = {
  Account: 'account',
  Appearance: 'appearance',
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
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="min-h-96">
          <Tabs defaultValue={SettingsTab.Appearance} orientation="vertical">
            <TabsList className="bg-transparent">
              <TabsTrigger value={SettingsTab.Account}>Account</TabsTrigger>
              <TabsTrigger value={SettingsTab.Appearance}>Appearance</TabsTrigger>
            </TabsList>
            <TabsContent value={SettingsTab.Account}>
              <SettingsAccount />
            </TabsContent>
            <TabsContent value={SettingsTab.Appearance}>
              <SettingsAppearance />
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
      Settings
    </DropdownMenuItem>
  );
}

export { SettingsDialog, SettingsDialogTrigger };
