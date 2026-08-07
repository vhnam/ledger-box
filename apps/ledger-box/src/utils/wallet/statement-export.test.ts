import { describe, expect, it } from 'vite-plus/test';

import type { StatementSnapshot } from '#/lib/wallet/statement';

import { buildStatementCsvFilename, encodeStatementCsv } from './statement-export';

function makeSnapshot(overrides: Partial<StatementSnapshot> = {}): StatementSnapshot {
  return {
    timezone: 'UTC',
    currency: 'USD',
    periodFrom: '2026-08-01T00:00:00.000Z',
    periodTo: '2026-08-08T00:00:00.000Z',
    snapshotAt: '2026-08-08T12:34:00.000Z',
    openingBalance: 100,
    closingBalance: 150,
    totalIn: 80,
    totalOut: 30,
    rows: [
      {
        type: 'income',
        amount: 80,
        description: 'Salary',
        occurredAt: '2026-08-02T00:00:00.000Z',
        runningBalance: 180,
      },
      {
        type: 'expense',
        amount: 30,
        description: '=SUM(A1)',
        occurredAt: '2026-08-03T00:00:00.000Z',
        runningBalance: 150,
      },
    ],
    ...overrides,
  };
}

describe('encodeStatementCsv', () => {
  it('includes a BOM, header summary, and one row per transaction', () => {
    const csv = encodeStatementCsv(makeSnapshot(), 'My Wallet');

    expect(csv.startsWith('﻿Statement,My Wallet')).toBe(true);
    expect(csv).toContain('Period,2026-08-01 to 2026-08-08');
    expect(csv).toContain('Opening balance,100.00');
    expect(csv).toContain('Date,Description,Type,Amount,Running balance');
    expect(csv).toContain('2026-08-02,Salary,income,80.00,180.00');
  });

  it('guards formula-trigger characters and negates expense amounts', () => {
    const csv = encodeStatementCsv(makeSnapshot(), null);

    expect(csv).toContain("2026-08-03,'=SUM(A1),expense,-30.00,150.00");
    expect(csv).toContain('Statement,Account statement');
  });

  it('labels an all-time snapshot without a period', () => {
    const csv = encodeStatementCsv(makeSnapshot({ periodFrom: null, periodTo: null }), 'My Wallet');

    expect(csv).toContain('Period,All time');
  });
});

describe('buildStatementCsvFilename', () => {
  it('builds a sanitized, period-scoped filename', () => {
    const filename = buildStatementCsvFilename(makeSnapshot(), 'My Wallet!');

    expect(filename).toBe('statement-My-Wallet-2026-08-01_2026-08-08-202608081234.csv');
  });

  it('falls back to "all-time" and a default name segment', () => {
    const filename = buildStatementCsvFilename(makeSnapshot({ periodFrom: null, periodTo: null }), '$$$');

    expect(filename).toBe('statement-statement-all-time-202608081234.csv');
  });
});
