import { faker } from '@faker-js/faker';
import { sql } from 'kysely';

import { db } from '#/lib/db/index.ts';

import { recordActivity } from '../netlify/functions/lib/activity-log.ts';
import { createTransaction } from '../netlify/functions/lib/wallet-mutations.ts';

type TransactionType = 'income' | 'expense';
type Currency = 'VND' | 'USD' | 'EUR' | 'JPY';

const CURRENCIES: Currency[] = ['VND', 'USD', 'EUR', 'JPY'];

/** Matches packages/utils/src/currency/constants.ts CURRENCY_FRACTION_DIGITS. */
const CURRENCY_FRACTION_DIGITS: Record<Currency, number> = {
  VND: 0,
  JPY: 0,
  USD: 2,
  EUR: 2,
};

/** Rough per-currency magnitude so seeded amounts look realistic (e.g. ~$20 vs ~500,000 VND). */
const CURRENCY_AMOUNT_RANGE: Record<Currency, { income: [number, number]; expense: [number, number] }> = {
  VND: { income: [1_000_000, 45_000_000], expense: [50_000, 12_000_000] },
  USD: { income: [50, 3_500], expense: [3, 900] },
  EUR: { income: [50, 3_200], expense: [3, 850] },
  JPY: { income: [8_000, 500_000], expense: [400, 130_000] },
};

/** Natural home locale/language for each currency, so seeded descriptions read like real local transactions. */
const CURRENCY_DESCRIPTIONS: Record<Currency, { income: string[]; expense: string[]; walletLabels: string[] }> = {
  VND: {
    income: [
      'Lương tháng',
      'Thanh toán dự án freelance',
      'Hóa đơn khách hàng',
      'Hoàn tiền mua sắm',
      'Tiền lãi tiết kiệm',
      'Bán đồ nội thất cũ',
      'Tiền thưởng',
      'Quà tặng nhận được',
    ],
    expense: [
      'Tiền thuê nhà',
      'Đi chợ mua thực phẩm',
      'Hóa đơn tiền điện',
      'Gói cước Netflix',
      'Ăn tối cùng bạn bè',
      'Đổ xăng và bảo dưỡng xe',
      'Mua thuốc ở nhà thuốc',
      'Cà phê và ăn trưa',
      'Mua giày thể thao mới',
      'Mua sách',
      'Phí tập gym',
      'Phí thuê văn phòng chia sẻ',
    ],
    walletLabels: ['Chi tiêu hàng ngày', 'Cá nhân', 'Gia đình', 'Du lịch', 'Kinh doanh'],
  },
  USD: {
    income: [
      'Monthly salary',
      'Freelance project payment',
      'Client invoice',
      'Cashback reward',
      'Interest payout',
      'Sold old furniture',
      'Gift received',
      'Bonus payout',
    ],
    expense: [
      'Rent payment',
      'Grocery shopping',
      'Electricity bill',
      'Netflix subscription',
      'Dinner with friends',
      'Gas and car maintenance',
      'Pharmacy purchase',
      'Coffee and lunch',
      'New running shoes',
      'Book purchase',
      'Gym membership',
      'Software subscription',
      'Co-working space rent',
    ],
    walletLabels: ['Everyday', 'Personal', 'Family', 'Travel', 'Business'],
  },
  EUR: {
    income: [
      'Monatsgehalt',
      'Zahlung für Freelance-Projekt',
      'Rechnung an Kunde',
      'Cashback-Prämie',
      'Zinsauszahlung',
      'Verkauf alter Möbel',
      'Geschenk erhalten',
      'Bonuszahlung',
    ],
    expense: [
      'Mietzahlung',
      'Lebensmitteleinkauf',
      'Stromrechnung',
      'Netflix-Abonnement',
      'Abendessen mit Freunden',
      'Tanken und Autowartung',
      'Einkauf in der Apotheke',
      'Kaffee und Mittagessen',
      'Neue Laufschuhe',
      'Buchkauf',
      'Fitnessstudio-Mitgliedschaft',
      'Software-Abonnement',
      'Miete Coworking-Space',
    ],
    walletLabels: ['Alltag', 'Privat', 'Familie', 'Reisen', 'Geschäftlich'],
  },
  JPY: {
    income: [
      '毎月の給与',
      'フリーランス案件の報酬',
      '取引先への請求',
      'キャッシュバック',
      '利息の入金',
      '中古家具の売却',
      'いただいたお祝い金',
      '賞与',
    ],
    expense: [
      '家賃の支払い',
      '食料品の買い出し',
      '電気代',
      'Netflixの月額料金',
      '友人との夕食',
      'ガソリン代と車のメンテナンス',
      '薬局での購入',
      'コーヒーとランチ',
      '新しいランニングシューズ',
      '書籍の購入',
      'ジムの会費',
      'ソフトウェアの月額料金',
      'コワーキングスペースの利用料',
    ],
    walletLabels: ['日常生活', '個人', '家族', '旅行', '事業'],
  },
};

const PERIOD_START = new Date('2026-06-01T00:00:00.000Z');
const PERIOD_END = new Date();

function roundToFractionDigits(value: number, fractionDigits: number): number {
  const factor = 10 ** fractionDigits;
  return Math.round(value * factor) / factor;
}

function randomAmount(currency: Currency, type: TransactionType): number {
  const [min, max] = CURRENCY_AMOUNT_RANGE[currency][type];
  return roundToFractionDigits(faker.number.float({ min, max }), CURRENCY_FRACTION_DIGITS[currency]);
}

function randomTransaction(currency: Currency) {
  const type: TransactionType = faker.helpers.arrayElement(['income', 'expense', 'expense', 'expense']);
  const descriptions = CURRENCY_DESCRIPTIONS[currency][type];
  const description = faker.helpers.arrayElement(descriptions);

  return {
    type,
    amount: randomAmount(currency, type),
    description,
    occurredAt: faker.date.between({ from: PERIOD_START, to: PERIOD_END }),
  };
}

function walletNameFor(currency: Currency): string {
  return `${faker.helpers.arrayElement(CURRENCY_DESCRIPTIONS[currency].walletLabels)} (${currency})`;
}

async function main() {
  const tenantId = process.argv[2];
  const transactionsPerWallet = Number(process.argv[3] ?? 20);

  if (!tenantId) {
    throw new Error('Usage: tsx scripts/seed.ts <tenant-id> [transactionsPerWallet]');
  }

  const user = await sql<{
    id: string;
    email: string;
  }>`select id, email from "user" where id = ${tenantId} limit 1`.execute(db);
  const actor = user.rows[0];

  if (!actor) {
    throw new Error(`No better-auth user found for tenant ${tenantId}`);
  }

  const actorContext = { userId: actor.id, email: actor.email };

  await db.transaction().execute(async (trx) => {
    for (const currency of CURRENCIES) {
      const walletName = walletNameFor(currency);

      const wallet = await trx
        .insertInto('wallet')
        .values({
          tenantId,
          name: walletName,
          amount: 0,
          currency,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      await recordActivity(trx, {
        walletId: wallet.id,
        tenantId,
        actorUserId: actorContext.userId,
        actorEmail: actorContext.email,
        entityType: 'wallet',
        entityId: wallet.id,
        action: 'create',
        before: null,
        after: { name: walletName, currency },
        walletAmountDelta: null,
      });

      const transactions = Array.from({ length: transactionsPerWallet }, () => randomTransaction(currency)).sort(
        (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
      );

      for (const transaction of transactions) {
        await createTransaction(trx, {
          walletId: wallet.id,
          tenantId,
          actor: actorContext,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          occurredAt: transaction.occurredAt,
        });
      }

      const finalWallet = await trx
        .selectFrom('wallet')
        .select('amount')
        .where('id', '=', wallet.id)
        .executeTakeFirstOrThrow();

      console.log(
        `✓ Seeded wallet "${wallet.id}" (${walletName}, ${currency}) with ${transactions.length} transactions, balance=${finalWallet.amount}`,
      );
    }
  });

  await db.destroy();
}

await main();
