import { FormattedMessage } from 'react-intl';

import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';
import { toast } from '@vhnam/ui/components/toast';
import { cn } from '@vhnam/ui/lib/utils';

import type { SupportedLocale } from '@vhnam/utils/locale';

import { useUpdateUserLocale } from '#/queries/user-settings/user-settings.mutations';
import { useUserLocale } from '#/queries/user-settings/user-settings.queries';

// A locale's own name is always rendered in its own language, regardless of the current
// UI language — a locale switcher must stay legible even to a viewer who can't read the
// active language yet.
const localeOptions: { value: SupportedLocale; label: string }[] = [
  { value: 'vi-VN', label: 'Tiếng Việt' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'fr-FR', label: 'Français' },
];

function LocaleOption({
  value,
  label,
  selected,
  onSelect,
}: {
  value: SupportedLocale;
  label: string;
  selected: boolean;
  onSelect: (value: SupportedLocale) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl border-2 p-3 text-left transition-all',
        selected ? 'border-foreground' : 'border-border hover:border-muted-foreground/40',
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      {selected && (
        <div className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-foreground">
          <Icon name="CheckIcon" className="size-2.5 text-background" />
        </div>
      )}
    </button>
  );
}

function SettingsLocale() {
  const { data, isPending } = useUserLocale();
  const updateLocale = useUpdateUserLocale();

  function handleSelect(locale: SupportedLocale) {
    if (locale === data?.locale || updateLocale.isPending) {
      return;
    }

    updateLocale.mutate(locale, {
      onError: (error) => {
        toast.add({ title: error.message, type: 'error' });
      },
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-medium">
          <FormattedMessage id="settings.locale.title" defaultMessage="Language" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            id="settings.locale.description"
            defaultMessage="Choose the language and regional formatting used across the app."
          />
        </p>
      </div>

      {isPending ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {localeOptions.map((option) => (
            <LocaleOption
              key={option.value}
              value={option.value}
              label={option.label}
              selected={data?.locale === option.value}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { SettingsLocale };
