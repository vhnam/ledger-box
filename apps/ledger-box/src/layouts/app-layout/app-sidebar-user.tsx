import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@vhnam/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@vhnam/ui/components/dropdown-menu';
import { Icon } from '@vhnam/ui/components/icon';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@vhnam/ui/components/sidebar';
import { toast } from '@vhnam/ui/components/sonner';

import { authClient, useSession } from '#/lib/auth-client';
import { SettingsDialog, SettingsDialogTrigger } from '#/modules/settings/settings-dialog';

function AppSidebarUser() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const avatarFallback = useMemo(() => {
    const name = session?.user.name?.trim() ?? '';
    return (
      name
        .split(' ')
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase() ?? 'N/A'
    );
  }, [session?.user.name]);

  async function handleSignOut() {
    await authClient.signOut();
    await navigate({ to: '/auth/login' });

    toast.success('Logged out successfully', {
      description: 'You have been logged out of your account',
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar>
                  <AvatarImage src={session?.user.image ?? undefined} alt={session?.user.name ?? undefined} />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{session?.user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{session?.user.email}</span>
                </div>
                <Icon name="CaretUpDownIcon" className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <SettingsDialogTrigger onOpen={() => setSettingsOpen(true)} />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSignOut}>
                <Icon name="SignOutIcon" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { AppSidebarUser };
