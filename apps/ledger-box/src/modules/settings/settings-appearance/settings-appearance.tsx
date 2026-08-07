import { FormattedMessage } from 'react-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { useTheme } from '@vhnam/ui/hooks/use-theme';
import { cn } from '@vhnam/ui/lib/utils';

import { SettingsLocalePicker } from '#/modules/settings/settings-locale';

type Theme = 'dark' | 'light' | 'system';

const themeOptions: {
  value: Theme;
  labelId: string;
  defaultLabel: string;
  icon: IconName;
  preview: [string, string, string];
}[] = [
  {
    value: 'light',
    labelId: 'settings.appearance.theme.light',
    defaultLabel: 'Light',
    icon: 'SunIcon',
    preview: ['bg-gray-100', 'bg-white', 'bg-gray-200'],
  },
  {
    value: 'system',
    labelId: 'settings.appearance.theme.system',
    defaultLabel: 'System',
    icon: 'DesktopIcon',
    preview: ['bg-gray-300', 'bg-gray-100', 'bg-gray-400'],
  },
  {
    value: 'dark',
    labelId: 'settings.appearance.theme.dark',
    defaultLabel: 'Dark',
    icon: 'MoonIcon',
    preview: ['bg-zinc-900', 'bg-zinc-800', 'bg-zinc-700'],
  },
];

function ThemePreview({ preview }: { preview: [string, string, string] }) {
  return (
    <div className={cn('flex h-10 w-full flex-col gap-1 overflow-hidden rounded-lg p-1.5', preview[0])}>
      <div className={cn('h-2 w-full rounded', preview[1])} />
      <div className={cn('h-1.5 w-3/4 rounded', preview[2])} />
    </div>
  );
}

function ThemeOption({
  value,
  labelId,
  defaultLabel,
  icon,
  preview,
  selected,
  onSelect,
}: (typeof themeOptions)[number] & {
  selected: boolean;
  onSelect: (value: Theme) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border-2 p-3 transition-all',
        selected ? 'border-foreground' : 'border-border hover:border-muted-foreground/40',
      )}
    >
      <ThemePreview preview={preview} />
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon name={icon} className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">
            <FormattedMessage id={labelId} defaultMessage={defaultLabel} />
          </span>
        </div>
        {selected && (
          <div className="flex size-3.5 items-center justify-center rounded-full bg-foreground">
            <Icon name="CheckIcon" className="size-2.5 text-background" />
          </div>
        )}
      </div>
    </button>
  );
}

function SettingsAppearance() {
  const { theme = 'system', setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="font-heading text-2xl font-semibold">
          <FormattedMessage id="settings.appearance.title" defaultMessage="Appearance" />
        </h1>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="settings.appearance.description"
            defaultMessage="Choose your preferred color theme and language."
          />
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <FormattedMessage id="settings.appearance.theme.title" defaultMessage="Theme" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <ThemeOption
                key={option.value}
                {...option}
                selected={theme === option.value}
                onSelect={(value) => setTheme(value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <SettingsLocalePicker />
    </div>
  );
}

export { SettingsAppearance };
