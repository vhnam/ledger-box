/**
 * Stable API error codes shared by Netlify handlers and the client.
 * English `message` values are for logs and transitional clients; the UI keys off `code`
 * via catalog entries `errors.{CODE}`.
 */
export const API_ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  METHOD_NOT_ALLOWED: 'Method Not Allowed',

  WALLET_ID_REQUIRED: 'Wallet id is required',
  MEMBER_ID_REQUIRED: 'Member id is required',
  TRANSACTION_ID_REQUIRED: 'Transaction id is required',
  ATTACHMENT_ID_REQUIRED: 'Attachment id is required',
  SHARE_ID_REQUIRED: 'Share id is required',
  WALLET_AND_SHARE_ID_REQUIRED: 'Wallet id and share id are required',

  WALLET_NOT_FOUND: 'Wallet not found',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  READ_ONLY_ACCESS: 'Read-only access',

  WALLET_NAME_REQUIRED: 'Wallet name is required',
  UNSUPPORTED_CURRENCY: 'Unsupported currency',
  CURRENCY_IMMUTABLE: 'Currency cannot be changed after wallet creation',

  INVALID_TRANSACTION_TYPE: 'Transaction type must be income or expense',
  AMOUNT_MUST_BE_POSITIVE: 'Amount must be greater than 0',
  DESCRIPTION_REQUIRED: 'Description is required',
  OCCURRED_AT_INVALID: 'Occurred at must be a date string',

  SOURCE_WALLET_REQUIRED: 'Source wallet is required',
  DESTINATION_WALLET_REQUIRED: 'Destination wallet is required',
  NOTE_REQUIRED: 'Note is required',
  TRANSFER_SAME_WALLET: 'Source and destination wallets must be different',
  TRANSFER_CURRENCY_MISMATCH: 'Cannot transfer between wallets with different currencies',

  EMAIL_REQUIRED: 'Email is required',
  ROLE_REQUIRED: 'Role is required',
  MEMBER_NOT_FOUND: 'Member not found',
  WALLET_OWNER_NOT_FOUND: 'Wallet owner not found',
  OWNER_ALREADY_MEMBER: 'Wallet owner is already a member',
  MEMBER_ALREADY_EXISTS: 'This person is already a member or has a pending invite.',
  INVITE_NOT_PENDING: 'Only pending invites can be resent',
  INVITE_EMAIL_RATE_LIMITED: 'Too many invite emails sent. Please try again shortly.',

  INVITE_NOT_VALID: 'This invite link is not valid.',
  INVITE_ALREADY_USED: 'This invite has already been used.',
  INVITE_EXPIRED: 'This invite link has expired.',
  INVITE_WALLET_UNAVAILABLE: 'This wallet is no longer available.',

  ATTACHMENTS_LOAD_FAILED: 'Failed to load attachments',
  INVALID_MULTIPART: 'Invalid multipart form data',
  FILE_REQUIRED: 'At least one file is required',
  UNSUPPORTED_FILE_TYPE: 'Only PDF, PNG, JPG, JPEG, and WEBP files are supported',
  FILE_EMPTY: 'File must not be empty',
  FILE_TOO_LARGE: 'File size must be 10 MB or less',
  ATTACHMENT_UPLOAD_FAILED: 'Failed to upload attachment',
  ATTACHMENT_NOT_FOUND: 'Attachment not found',
  ATTACHMENT_DELETE_FAILED: 'Failed to delete attachment',

  PERIOD_START_REQUIRED: 'Period start is required',
  PERIOD_END_REQUIRED: 'Period end is required',
  DISPLAY_TITLE_TYPE_INVALID: 'Display title must be a string',
  DISPLAY_TITLE_TOO_LONG: 'Display title must be 80 characters or fewer',
  EXPIRY_INVALID: 'Expiry must be a date string or null',
  SHARE_NOT_FOUND: 'Share not found',

  STATEMENT_LINK_INVALID: 'This link is not valid.',
  STATEMENT_LINK_REVOKED: 'This link has been revoked.',
  STATEMENT_LINK_EXPIRED: 'This link has expired.',
  STATEMENT_UNAVAILABLE: 'This statement is no longer available.',
  STATEMENT_RATE_LIMITED: 'Too many requests. Please try again shortly.',

  UNSUPPORTED_LOCALE: 'Unsupported locale',
  INVALID_REQUEST_BODY: 'Invalid request body',
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_MESSAGES;

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
};

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(API_ERROR_MESSAGES, value);
}

export function apiErrorCatalogId(code: ApiErrorCode): string {
  return `errors.${code}`;
}
