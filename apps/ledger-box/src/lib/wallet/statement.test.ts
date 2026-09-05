import type { Kysely } from 'kysely';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { Database } from '#/lib/db/schema';

const listTransactionAttachments = vi.fn().mockResolvedValue([]);
const getAttachmentViewUrl = vi.fn();

vi.mock('#/lib/storage/r2', () => ({
  listTransactionAttachments: (...args: unknown[]) => listTransactionAttachments(...args),
  getAttachmentViewUrl: (...args: unknown[]) => getAttachmentViewUrl(...args),
}));

import { buildStatement, resolveAttachmentViewUrls } from './statement';

type FakeRow = Record<string, unknown>;

/**
 * Minimal stand-in for a Kysely query builder: every chained method returns itself, and
 * `execute`/`executeTakeFirst` resolve from queues keyed by the table passed to `selectFrom`.
 */
function createFakeDb(config: { wallet: FakeRow | undefined; transactionResults: FakeRow[][] }) {
  const transactionQueue = [...config.transactionResults];

  const builder = {
    select: () => builder,
    where: () => builder,
    orderBy: () => builder,
    executeTakeFirst: () => Promise.resolve(config.wallet),
    execute: () => Promise.resolve(transactionQueue.shift() ?? []),
  };

  return {
    selectFrom: vi.fn(() => builder),
  } as unknown as Kysely<Database>;
}

describe('buildStatement', () => {
  it('throws when the wallet does not exist', async () => {
    const db = createFakeDb({ wallet: undefined, transactionResults: [] });

    await expect(buildStatement(db, 'w1', 't1', null, 'UTC')).rejects.toThrow('Wallet not found');
  });

  it('throws when the wallet is soft-deleted', async () => {
    const db = createFakeDb({
      wallet: { amount: 100, currency: 'USD', deletedAt: new Date() },
      transactionResults: [],
    });

    await expect(buildStatement(db, 'w1', 't1', null, 'UTC')).rejects.toThrow('Wallet not found');
  });

  it('computes running balances and totals for an all-time statement', async () => {
    const db = createFakeDb({
      wallet: { amount: 150, currency: 'USD', deletedAt: null },
      transactionResults: [
        [
          { id: 'tx1', type: 'income', amount: 200, description: 'Salary', occurredAt: '2026-08-01T00:00:00.000Z' },
          {
            id: 'tx2',
            type: 'expense',
            amount: 50,
            description: 'Groceries',
            occurredAt: '2026-08-02T00:00:00.000Z',
          },
        ],
      ],
    });

    const snapshot = await buildStatement(db, 'w1', 't1', null, 'UTC');

    expect(snapshot.openingBalance).toBe(0);
    expect(snapshot.totalIn).toBe(200);
    expect(snapshot.totalOut).toBe(50);
    expect(snapshot.closingBalance).toBe(150);
    expect(snapshot.rows.map((row) => row.runningBalance)).toEqual([200, 150]);
    expect(snapshot.periodFrom).toBeNull();
  });

  it('uses the opening-balance query result when bounds are given', async () => {
    const db = createFakeDb({
      wallet: { amount: 300, currency: 'USD', deletedAt: null },
      transactionResults: [
        [{ type: 'income', amount: 100 }],
        [{ id: 'tx1', type: 'income', amount: 250, description: 'Bonus', occurredAt: '2026-08-05T00:00:00.000Z' }],
      ],
    });

    const bounds = { start: new Date('2026-08-01T00:00:00.000Z'), endExclusive: new Date('2026-09-01T00:00:00.000Z') };
    const snapshot = await buildStatement(db, 'w1', 't1', bounds, 'UTC');

    expect(snapshot.openingBalance).toBe(100);
    expect(snapshot.closingBalance).toBe(350);
    expect(snapshot.periodFrom).toBe(bounds.start.toISOString());
  });

  it('embeds each row’s attachment keys, resolved per transaction id', async () => {
    listTransactionAttachments.mockImplementation((_tenantId: string, transactionId: string) => {
      if (transactionId === 'tx1') {
        return Promise.resolve([
          {
            id: 'a1',
            key: 'tenants/t1/transactions/tx1/a1/receipt.pdf',
            fileName: 'receipt.pdf',
            contentType: 'application/pdf',
            size: 1024,
            url: 'https://public.example.com/a1',
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const db = createFakeDb({
      wallet: { amount: 200, currency: 'USD', deletedAt: null },
      transactionResults: [
        [
          { id: 'tx1', type: 'income', amount: 100, description: 'Salary', occurredAt: '2026-08-01T00:00:00.000Z' },
          { id: 'tx2', type: 'expense', amount: 20, description: 'Coffee', occurredAt: '2026-08-02T00:00:00.000Z' },
        ],
      ],
    });

    const snapshot = await buildStatement(db, 'w1', 'tenant-1', null, 'UTC');

    expect(listTransactionAttachments).toHaveBeenCalledWith('tenant-1', 'tx1');
    expect(listTransactionAttachments).toHaveBeenCalledWith('tenant-1', 'tx2');
    // Only the stable object key is frozen into the snapshot — never a URL (permanent or
    // presigned), which is exactly what `resolveAttachmentViewUrls` is for.
    expect(snapshot.rows[0].attachments).toEqual([
      {
        id: 'a1',
        key: 'tenants/t1/transactions/tx1/a1/receipt.pdf',
        fileName: 'receipt.pdf',
        contentType: 'application/pdf',
        size: 1024,
      },
    ]);
    expect(snapshot.rows[1].attachments).toEqual([]);
  });
});

describe('resolveAttachmentViewUrls', () => {
  it('signs a fresh view URL for each attachment, keyed by TTL', async () => {
    getAttachmentViewUrl.mockImplementation(({ key }: { key: string }) =>
      Promise.resolve(`https://signed.example.com/${key}`),
    );

    const snapshot = {
      timezone: 'UTC',
      currency: 'USD',
      periodFrom: null,
      periodTo: null,
      snapshotAt: '2026-08-08T00:00:00.000Z',
      openingBalance: 0,
      closingBalance: 0,
      totalIn: 0,
      totalOut: 0,
      rows: [
        {
          type: 'income' as const,
          amount: 100,
          description: 'Salary',
          occurredAt: '2026-08-01T00:00:00.000Z',
          runningBalance: 100,
          attachments: [{ id: 'a1', key: 'k1', fileName: 'receipt.pdf', contentType: 'application/pdf', size: 1024 }],
        },
      ],
    };

    const resolved = await resolveAttachmentViewUrls(snapshot, 900);

    expect(getAttachmentViewUrl).toHaveBeenCalledWith({
      key: 'k1',
      fileName: 'receipt.pdf',
      contentType: 'application/pdf',
      expiresInSeconds: 900,
    });
    expect(resolved.rows[0].attachments).toEqual([
      {
        id: 'a1',
        fileName: 'receipt.pdf',
        contentType: 'application/pdf',
        size: 1024,
        url: 'https://signed.example.com/k1',
      },
    ]);
  });

  it('falls back to a legacy stored url when an attachment has no key, and drops rows with neither', async () => {
    getAttachmentViewUrl.mockClear();

    const legacySnapshot = {
      timezone: 'UTC',
      currency: 'USD',
      periodFrom: null,
      periodTo: null,
      snapshotAt: '2026-08-08T00:00:00.000Z',
      openingBalance: 0,
      closingBalance: 0,
      totalIn: 0,
      totalOut: 0,
      rows: [
        {
          type: 'expense' as const,
          amount: 20,
          description: 'Coffee',
          occurredAt: '2026-08-02T00:00:00.000Z',
          runningBalance: -20,
          // Legacy shapes cast through `unknown` inside the resolver, so this is deliberately
          // not the current `StatementAttachment` shape.
          attachments: [
            {
              id: 'legacy-with-url',
              fileName: 'old.png',
              contentType: 'image/png',
              size: 10,
              url: 'https://old.example.com/x',
            },
            { id: 'legacy-with-neither', fileName: 'gone.png', contentType: 'image/png', size: 10 },
          ] as never,
        },
        // A row predating attachment capture entirely.
        {
          type: 'income' as const,
          amount: 5,
          description: 'Refund',
          occurredAt: '2026-08-03T00:00:00.000Z',
          runningBalance: -15,
          attachments: undefined as never,
        },
      ],
    };

    const resolved = await resolveAttachmentViewUrls(legacySnapshot, 900);

    expect(getAttachmentViewUrl).not.toHaveBeenCalled();
    expect(resolved.rows[0].attachments).toEqual([
      {
        id: 'legacy-with-url',
        fileName: 'old.png',
        contentType: 'image/png',
        size: 10,
        url: 'https://old.example.com/x',
      },
    ]);
    expect(resolved.rows[1].attachments).toEqual([]);
  });
});
