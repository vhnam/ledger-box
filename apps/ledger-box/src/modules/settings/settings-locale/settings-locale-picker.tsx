import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vhnam/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';
import { Spinner } from '@vhnam/ui/components/spinner';
import { toast } from '@vhnam/ui/components/toast';

import type { SupportedLocale } from '@vhnam/utils/locale';

import { useLocaleTransition } from '#/lib/locale/locale-transition';

import { useUpdateUserLocale } from '#/queries/user-settings/user-settings.mutations';
import { useUserLocale } from '#/queries/user-settings/user-settings.queries';

// A locale's own name is always rendered in its own language, regardless of the current
// UI language — a locale switcher must stay legible even to a viewer who can't read the
// active language yet.
const LOCALE_OPTIONS: { value: SupportedLocale; label: string; flagEmoji: string }[] = [
  { value: 'vi-VN', label: 'Tiếng Việt', flagEmoji: '🇻🇳' },
  { value: 'en-US', label: 'English (US)', flagEmoji: '🇺🇸' },
  { value: 'en-GB', label: 'English (UK)', flagEmoji: '🇬🇧' },
  { value: 'ja-JP', label: '日本語', flagEmoji: '🇯🇵' },
  { value: 'fr-FR', label: 'Français', flagEmoji: '🇫🇷' },
  { value: 'zh-CN', label: '简体中文', flagEmoji: '🇨🇳' },
  { value: 'zh-TW', label: '繁體中文', flagEmoji: '🇹🇼' },
];

function SettingsLocalePicker() {
  const intl = useIntl();
  const { data, isPending } = useUserLocale();
  const updateLocale = useUpdateUserLocale();
  const { phase, beginTransition, failTransition } = useLocaleTransition();

  const selectItems = useMemo(
    () =>
      LOCALE_OPTIONS.map(({ value, label, flagEmoji }) => ({
        value,
        label: `${flagEmoji} ${label}`,
      })),
    [],
  );

  function handleValueChange(value: string | null) {
    if (!value || updateLocale.isPending || phase !== 'idle') {
      return;
    }

    const locale = value as SupportedLocale;
    if (locale === data?.locale) {
      return;
    }

    beginTransition(locale);
    updateLocale.mutate(locale, {
      onError: (error) => {
        failTransition();
        toast.add({ title: error.message, type: 'error' });
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <FormattedMessage id="settings.locale.title" defaultMessage="Language" />
        </CardTitle>
        <CardDescription>
          <FormattedMessage
            id="settings.locale.description"
            defaultMessage="Choose the language and regional formatting used across the app."
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : (
          <Select
            items={selectItems}
            value={data?.locale}
            disabled={updateLocale.isPending || phase !== 'idle'}
            onValueChange={handleValueChange}
          >
            <SelectTrigger
              className="w-full"
              aria-label={intl.formatMessage({
                id: 'settings.locale.title',
                defaultMessage: 'Language',
              })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span aria-hidden="true">{option.flagEmoji}</span>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}

export { SettingsLocalePicker };
