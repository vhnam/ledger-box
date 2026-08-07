import axios from 'axios';

import {
  apiErrorCatalogId,
  isApiErrorCode,
  type ApiErrorBody,
  type ApiErrorCode,
} from '#/utils/api-error/api-error-codes';

type ApiError = {
  code: ApiErrorCode | null;
  message: string;
};

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    'message' in data &&
    typeof (data as ApiErrorBody).code === 'string' &&
    typeof (data as ApiErrorBody).message === 'string'
  );
}

/**
 * Parses an Axios/API failure into a stable error code (when present) and a string suitable
 * for `formatErrorMessage`: catalog id `errors.{CODE}` when the code is known, otherwise the
 * English message or the provided fallback (which may itself be a catalog id).
 */
function getApiError(error: unknown, fallback: string): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (isApiErrorBody(data) && isApiErrorCode(data.code)) {
      return {
        code: data.code,
        message: apiErrorCatalogId(data.code),
      };
    }

    // Transitional: plain-text bodies from older deployments.
    if (typeof data === 'string' && data.length > 0) {
      return { code: null, message: data };
    }

    // Legacy locale PATCH shape `{ error: string }`.
    if (typeof data === 'object' && data !== null && 'error' in data) {
      const legacy = (data as { error: unknown }).error;
      if (typeof legacy === 'string' && legacy.length > 0) {
        return { code: null, message: legacy };
      }
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return { code: null, message: error.message };
  }

  return { code: null, message: fallback };
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  return getApiError(error, fallback).message;
}

export { getApiError, getApiErrorMessage };
export type { ApiError };
