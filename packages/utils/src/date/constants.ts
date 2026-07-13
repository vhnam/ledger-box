export const DateFormat = {
  /** e.g. 13/07/2026 */
  Numeric: 'dd/MM/yyyy',
  /** e.g. 13/7/2026 */
  Short: 'd/M/yyyy',
  /** e.g. 13 Jul 2026 */
  Text: 'd MMM yyyy',
  /** e.g. 13 July 2026 */
  Long: 'd MMMM yyyy',
  /** e.g. 07/2026 */
  Month: 'MM/yyyy',
} as const;

export type DateFormat = (typeof DateFormat)[keyof typeof DateFormat];

export const DateTimeFormat = {
  /** e.g. 13/07/2026 19:30 */
  Numeric: 'dd/MM/yyyy HH:mm',
  /** e.g. 13/7/2026 19:30 */
  Short: 'd/M/yyyy HH:mm',
  /** e.g. 13 Jul 2026 19:30 */
  Text: 'd MMM yyyy HH:mm',
} as const;

export type DateTimeFormat = (typeof DateTimeFormat)[keyof typeof DateTimeFormat];

export const DEFAULT_DATE_FORMAT = DateFormat.Numeric;
export const DEFAULT_DATE_TIME_FORMAT = DateTimeFormat.Numeric;
