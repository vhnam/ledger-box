import { RiCheckLine, RiComputerLine, RiMoonLine, RiSunLine, type RemixiconComponentType } from '@remixicon/react';

import { Icon } from '@vhnam/ui/components/icon';
import { useTheme } from '@vhnam/ui/hooks/use-theme';
import { cn } from '@vhnam/ui/lib/utils';

type Theme = 'dark' | 'light' | 'system';

const themeOptions: {
  value: Theme;
  label: string;
  icon: RemixiconComponentType;
  preview: [string, string, string];
}[] = [
  { value: 'light', label: 'Light', icon: RiSunLine, preview: ['bg-gray-100', 'bg-white', 'bg-gray-200'] },
  { value: 'system', label: 'System', icon: RiComputerLine, preview: ['bg-gray-300', 'bg-gray-100', 'bg-gray-400'] },
  { value: 'dark', label: 'Dark', icon: RiMoonLine, preview: ['bg-zinc-900', 'bg-zinc-800', 'bg-zinc-700'] },
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
  label,
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
          <Icon icon={icon} className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        {selected && (
          <div className="flex size-3.5 items-center justify-center rounded-full bg-foreground">
            <RiCheckLine className="size-2.5 text-background" />
          </div>
        )}
      </div>
    </button>
  );
}

function SettingsAppearance() {
  const { theme = 'system', setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">Appearance</h2>
        <p className="text-sm text-muted-foreground">Choose your preferred color theme.</p>
      </div>
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
    </div>
  );
}

export { SettingsAppearance };
