import { API_ERROR_MESSAGES, type ApiErrorBody, type ApiErrorCode } from '#/lib/api-error-codes.ts';

/**
 * Returns a JSON error Response `{ code, message }` for app Netlify handlers.
 * Prefer factories over shared Response instances so bodies remain readable if needed.
 */
function apiError(code: ApiErrorCode, status: number): Response {
  const body: ApiErrorBody = {
    code,
    message: API_ERROR_MESSAGES[code],
  };

  return Response.json(body, { status });
}

const ApiErrors = {
  unauthorized: () => apiError('UNAUTHORIZED', 401),
  methodNotAllowed: () => apiError('METHOD_NOT_ALLOWED', 405),
  walletNotFound: () => apiError('WALLET_NOT_FOUND', 404),
  transactionNotFound: () => apiError('TRANSACTION_NOT_FOUND', 404),
  readOnlyAccess: () => apiError('READ_ONLY_ACCESS', 403),
} as const;

export { ApiErrors, apiError };
