import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import PDFDocument from 'pdfkit';
import { createIntl, createIntlCache } from 'react-intl';

import { formatCurrency, formatSignedCurrency } from '@vhnam/utils/currency';
import { formatInTimeZone, LOCALE_DATE_PATTERNS, LOCALE_DATE_TIME_PATTERNS } from '@vhnam/utils/date';
import { MESSAGES, toMessageLanguage } from '@vhnam/utils/i18n/all-messages';
import { DEFAULT_LOCALE, type SupportedLocale } from '@vhnam/utils/locale';

import type { ResolvedStatementAttachment, StatementSnapshot } from '#/lib/wallet/statement';

type ResolvedStatementSnapshot = StatementSnapshot<ResolvedStatementAttachment>;

const intlCache = createIntlCache();

const CJK_LOCALES = new Set<SupportedLocale>(['ja-JP', 'zh-CN', 'zh-TW']);

function resolveFontPath(filename: string): string {
  const moduleRelative = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../assets/fonts', filename);
  const candidates = [
    moduleRelative,
    path.join(process.cwd(), 'apps/ledger-box/assets/fonts', filename),
    path.join(process.cwd(), 'assets/fonts', filename),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Statement PDF font not found: ${filename}`);
}

type EncodeStatementPdfOptions = {
  locale: SupportedLocale;
};

function createPdfIntl(locale: SupportedLocale) {
  return createIntl(
    {
      locale,
      defaultLocale: DEFAULT_LOCALE,
      messages: MESSAGES[toMessageLanguage(locale)],
    },
    intlCache,
  );
}

function labelLocaleFor(locale: SupportedLocale): SupportedLocale {
  return CJK_LOCALES.has(locale) ? DEFAULT_LOCALE : locale;
}

function formatPdfDate(isoValue: string | null, timezone: string, locale: SupportedLocale): string {
  if (!isoValue) {
    return '';
  }

  return formatInTimeZone(isoValue, timezone, LOCALE_DATE_PATTERNS[locale].Medium, locale);
}

function formatPdfGeneratedAt(isoValue: string, timezone: string, locale: SupportedLocale): string {
  return formatInTimeZone(isoValue, timezone, LOCALE_DATE_TIME_PATTERNS[locale].Medium, locale);
}

function ensureFontsExist(): { regular: string; bold: string } {
  const regular = resolveFontPath('NotoSans-Regular.ttf');
  const bold = resolveFontPath('NotoSans-Bold.ttf');
  readFileSync(regular);
  readFileSync(bold);

  return { regular, bold };
}

export async function encodeStatementPdf(
  snapshot: ResolvedStatementSnapshot,
  displayTitle: string | null,
  options: EncodeStatementPdfOptions,
): Promise<Uint8Array> {
  const fonts = ensureFontsExist();

  const { locale } = options;
  const labels = createPdfIntl(labelLocaleFor(locale));
  const currencyOptions = { currency: snapshot.currency, locale, notation: 'standard' as const };

  const title =
    displayTitle?.trim() ||
    labels.formatMessage({ id: 'statement.export.pdf.titleFallback', defaultMessage: 'Account statement' });

  const allTimeLabel = labels.formatMessage({ id: 'statement.snapshot.allTime', defaultMessage: 'All time' });
  const periodFromLabel = formatPdfDate(snapshot.periodFrom, snapshot.timezone, locale);
  const periodToLabel = formatPdfDate(snapshot.periodTo, snapshot.timezone, locale);
  const periodLabel = periodFromLabel && periodToLabel ? `${periodFromLabel} - ${periodToLabel}` : allTimeLabel;

  const generatedLabel = labels.formatMessage(
    { id: 'statement.snapshot.generated', defaultMessage: 'Generated {date}' },
    { date: formatPdfGeneratedAt(snapshot.snapshotAt, snapshot.timezone, locale) },
  );

  const openingLabel = labels.formatMessage({ id: 'statement.snapshot.opening', defaultMessage: 'Opening' });
  const closingLabel = labels.formatMessage({ id: 'statement.snapshot.closing', defaultMessage: 'Closing' });
  const totalInLabel = labels.formatMessage({ id: 'statement.snapshot.totalIn', defaultMessage: 'Total in' });
  const totalOutLabel = labels.formatMessage({ id: 'statement.snapshot.totalOut', defaultMessage: 'Total out' });
  const emptyLabel = labels.formatMessage({
    id: 'statement.snapshot.empty',
    defaultMessage: 'No transactions in this period.',
  });
  const dateHeader = labels.formatMessage({ id: 'statement.export.pdf.column.date', defaultMessage: 'Date' });
  const descriptionHeader = labels.formatMessage({
    id: 'statement.export.pdf.column.description',
    defaultMessage: 'Description',
  });
  const amountHeader = labels.formatMessage({ id: 'statement.export.pdf.column.amount', defaultMessage: 'Amount' });
  const balanceHeader = labels.formatMessage({
    id: 'statement.export.pdf.column.runningBalance',
    defaultMessage: 'Balance',
  });

  const margin = 48;
  const pageWidth = 595.28;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = 780;
  const dateColWidth = 90;
  const amountColWidth = 75;
  const balanceColWidth = 75;
  const descriptionColWidth = contentWidth - dateColWidth - amountColWidth - balanceColWidth - 12;

  const doc = new PDFDocument({ size: 'A4', margin, autoFirstPage: true });
  doc.registerFont('NotoSans', fonts.regular);
  doc.registerFont('NotoSans-Bold', fonts.bold);

  const chunks: Buffer[] = [];

  const done = new Promise<Uint8Array>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Uint8Array.from(Buffer.concat(chunks))));
    doc.on('error', reject);
  });

  let y = margin;

  function ensureSpace(needed: number): void {
    if (y + needed <= bottomLimit) {
      return;
    }

    doc.addPage();
    y = margin;
    drawColumnHeaders();
  }

  function drawColumnHeaders(): void {
    doc.font('NotoSans-Bold').fontSize(9).fillColor('#111111');
    doc.text(dateHeader, margin, y, { width: dateColWidth, lineBreak: false });
    doc.text(descriptionHeader, margin + dateColWidth + 4, y, { width: descriptionColWidth, lineBreak: false });
    doc.text(amountHeader, margin + dateColWidth + descriptionColWidth + 8, y, {
      width: amountColWidth,
      align: 'right',
      lineBreak: false,
    });
    doc.text(balanceHeader, margin + dateColWidth + descriptionColWidth + amountColWidth + 12, y, {
      width: balanceColWidth,
      align: 'right',
      lineBreak: false,
    });
    y += 14;
    doc
      .moveTo(margin, y)
      .lineTo(margin + contentWidth, y)
      .strokeColor('#dddddd')
      .lineWidth(0.5)
      .stroke();
    y += 8;
  }

  doc.font('NotoSans-Bold').fontSize(16).fillColor('#111111').text(title, margin, y, { width: contentWidth });
  y = doc.y + 6;

  doc
    .font('NotoSans')
    .fontSize(10)
    .fillColor('#555555')
    .text(`${periodLabel} (${snapshot.timezone})`, margin, y, { width: contentWidth });
  y = doc.y + 2;
  doc.text(generatedLabel, margin, y, { width: contentWidth });
  y = doc.y + 14;

  const summaryItems = [
    [openingLabel, formatCurrency(snapshot.openingBalance, currencyOptions)],
    [closingLabel, formatCurrency(snapshot.closingBalance, currencyOptions)],
    [totalInLabel, formatCurrency(snapshot.totalIn, currencyOptions)],
    [totalOutLabel, formatCurrency(snapshot.totalOut, currencyOptions)],
  ] as const;

  const summaryColWidth = contentWidth / 4;
  const summaryTop = y;

  for (const [index, [label, value]] of summaryItems.entries()) {
    const x = margin + index * summaryColWidth;
    doc
      .font('NotoSans')
      .fontSize(8)
      .fillColor('#666666')
      .text(label, x, summaryTop, {
        width: summaryColWidth - 8,
        lineBreak: false,
      });
    doc
      .font('NotoSans-Bold')
      .fontSize(10)
      .fillColor('#111111')
      .text(value, x, summaryTop + 12, {
        width: summaryColWidth - 8,
        lineBreak: false,
      });
  }

  y = summaryTop + 36;

  if (snapshot.rows.length === 0) {
    doc.font('NotoSans').fontSize(10).fillColor('#666666').text(emptyLabel, margin, y, { width: contentWidth });
  } else {
    drawColumnHeaders();

    const attachmentLineHeight = 12;

    for (const row of snapshot.rows) {
      const dateText = formatPdfDate(row.occurredAt, snapshot.timezone, locale);
      const amountText = formatSignedCurrency(row.amount, row.type, currencyOptions);
      const balanceText = formatCurrency(row.runningBalance, currencyOptions);
      const attachments = row.attachments ?? [];
      doc.font('NotoSans').fontSize(9);
      const descriptionHeight = doc.heightOfString(row.description || ' ', {
        width: descriptionColWidth,
      });
      const attachmentsHeight = attachments.length > 0 ? attachments.length * attachmentLineHeight + 2 : 0;
      const rowHeight = Math.max(22, descriptionHeight + attachmentsHeight + 6);

      ensureSpace(rowHeight);

      const rowTop = y;
      doc.font('NotoSans').fontSize(9).fillColor('#111111');
      doc.text(dateText, margin, rowTop, { width: dateColWidth, lineBreak: false });
      doc.text(row.description, margin + dateColWidth + 4, rowTop, { width: descriptionColWidth });

      if (attachments.length > 0) {
        let attachmentY = rowTop + descriptionHeight + 2;

        doc.font('NotoSans').fontSize(8).fillColor('#2563eb');

        for (const attachment of attachments) {
          doc.text(attachment.fileName, margin + dateColWidth + 4, attachmentY, {
            width: descriptionColWidth,
            link: attachment.url,
            underline: true,
            lineBreak: false,
          });
          attachmentY += attachmentLineHeight;
        }
      }

      doc.fillColor(row.type === 'income' ? '#059669' : '#e11d48');
      doc.text(amountText, margin + dateColWidth + descriptionColWidth + 8, rowTop, {
        width: amountColWidth,
        align: 'right',
        lineBreak: false,
      });
      doc.fillColor('#666666');
      doc.text(balanceText, margin + dateColWidth + descriptionColWidth + amountColWidth + 12, rowTop, {
        width: balanceColWidth,
        align: 'right',
        lineBreak: false,
      });

      y = rowTop + rowHeight;
    }
  }

  doc.end();

  return done;
}
