import axios from 'axios';

import type { SupportedLocale } from '@vhnam/utils/locale';

import { getApiErrorMessage } from '#/lib/api-error/api-error';

import type { UserLocaleDto } from '#/queries/user-settings/user-settings.dto';

export async function fetchUserLocale(): Promise<UserLocaleDto> {
  try {
    const { data } = await axios.get<UserLocaleDto>('/api/users/locale');

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'settings.locale.loadErrorFallback'));
  }
}

export async function updateUserLocale(locale: SupportedLocale): Promise<UserLocaleDto> {
  try {
    const { data } = await axios.patch<UserLocaleDto>('/api/users/locale', { locale });

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'settings.locale.updateErrorFallback'));
  }
}
