import type { TransactionType } from './schema';

type SeedTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  datetime: string;
};

type SeedWallet = {
  id: string;
  name: string;
  transactions: SeedTransaction[];
};

const SEED_WALLETS: SeedWallet[] = [
  {
    id: '1',
    name: 'Personal',
    transactions: [
      { id: 't1', type: 'income', amount: 4200, description: 'Monthly salary', datetime: '2026-07-01T09:00:00' },
      { id: 't2', type: 'expense', amount: 1100, description: 'Apartment rent', datetime: '2026-07-02T10:00:00' },
      { id: 't3', type: 'expense', amount: 148, description: 'Weekly groceries', datetime: '2026-07-05T14:30:00' },
      { id: 't4', type: 'income', amount: 650, description: 'Freelance design work', datetime: '2026-07-08T16:00:00' },
      {
        id: 't5',
        type: 'expense',
        amount: 79,
        description: 'Streaming & subscriptions',
        datetime: '2026-07-10T08:00:00',
      },
      { id: 't6', type: 'expense', amount: 55, description: 'Gym membership', datetime: '2026-07-11T07:30:00' },
      { id: 't7', type: 'expense', amount: 38, description: 'Coffee & lunch out', datetime: '2026-07-09T13:00:00' },
      { id: 't8', type: 'expense', amount: 220, description: 'Phone bill', datetime: '2026-07-03T11:00:00' },
      { id: 't9', type: 'income', amount: 4200, description: 'Monthly salary', datetime: '2026-06-01T09:00:00' },
      { id: 't10', type: 'expense', amount: 1100, description: 'Apartment rent', datetime: '2026-06-02T10:00:00' },
      {
        id: 't11',
        type: 'expense',
        amount: 320,
        description: 'Flight tickets — summer trip',
        datetime: '2026-06-14T16:00:00',
      },
      {
        id: 't12',
        type: 'expense',
        amount: 240,
        description: 'Electricity & internet',
        datetime: '2026-06-25T11:00:00',
      },
      { id: 't13', type: 'income', amount: 300, description: 'Sold old laptop', datetime: '2026-06-18T15:00:00' },
      { id: 't14', type: 'expense', amount: 92, description: 'Restaurant dinner', datetime: '2026-06-20T19:30:00' },
      { id: 't15', type: 'expense', amount: 49, description: 'Cloud storage plan', datetime: '2026-06-07T08:00:00' },
      { id: 't16', type: 'income', amount: 4200, description: 'Monthly salary', datetime: '2026-05-01T09:00:00' },
      { id: 't17', type: 'expense', amount: 1100, description: 'Apartment rent', datetime: '2026-05-02T10:00:00' },
      { id: 't18', type: 'expense', amount: 165, description: 'New running shoes', datetime: '2026-05-10T14:00:00' },
      { id: 't19', type: 'expense', amount: 75, description: 'Weekly groceries', datetime: '2026-05-17T12:00:00' },
      { id: 't20', type: 'income', amount: 500, description: 'Tax refund', datetime: '2026-05-22T10:00:00' },
    ],
  },
  {
    id: '2',
    name: 'Savings',
    transactions: [
      {
        id: 's1',
        type: 'income',
        amount: 800,
        description: 'Monthly savings transfer',
        datetime: '2026-07-01T12:00:00',
      },
      {
        id: 's2',
        type: 'income',
        amount: 800,
        description: 'Monthly savings transfer',
        datetime: '2026-06-01T12:00:00',
      },
      {
        id: 's3',
        type: 'income',
        amount: 800,
        description: 'Monthly savings transfer',
        datetime: '2026-05-01T12:00:00',
      },
      {
        id: 's4',
        type: 'income',
        amount: 800,
        description: 'Monthly savings transfer',
        datetime: '2026-04-01T12:00:00',
      },
      {
        id: 's5',
        type: 'income',
        amount: 800,
        description: 'Monthly savings transfer',
        datetime: '2026-03-01T12:00:00',
      },
      { id: 's6', type: 'expense', amount: 1200, description: 'Emergency car repair', datetime: '2026-05-18T09:00:00' },
      { id: 's7', type: 'income', amount: 2000, description: 'Year-end bonus', datetime: '2026-03-15T10:00:00' },
      { id: 's8', type: 'expense', amount: 950, description: 'Laptop upgrade', datetime: '2026-04-22T14:00:00' },
      { id: 's9', type: 'income', amount: 350, description: 'Sold camera gear', datetime: '2026-04-10T11:00:00' },
      {
        id: 's10',
        type: 'income',
        amount: 800,
        description: 'Monthly savings transfer',
        datetime: '2026-02-01T12:00:00',
      },
      {
        id: 's11',
        type: 'expense',
        amount: 480,
        description: 'Annual insurance premium',
        datetime: '2026-02-14T09:00:00',
      },
      {
        id: 's12',
        type: 'income',
        amount: 1500,
        description: 'Freelance bonus payment',
        datetime: '2026-06-28T16:00:00',
      },
      { id: 's13', type: 'expense', amount: 300, description: 'Home décor', datetime: '2026-05-30T15:00:00' },
      {
        id: 's14',
        type: 'income',
        amount: 800,
        description: 'Monthly savings transfer',
        datetime: '2026-01-01T12:00:00',
      },
      { id: 's15', type: 'expense', amount: 200, description: 'Concert tickets', datetime: '2026-06-10T18:00:00' },
      { id: 's16', type: 'income', amount: 600, description: 'Gift from family', datetime: '2026-03-28T10:00:00' },
    ],
  },
  {
    id: '3',
    name: 'Business',
    transactions: [
      {
        id: 'b1',
        type: 'income',
        amount: 6500,
        description: 'Client payment — Meridian Co.',
        datetime: '2026-07-03T10:00:00',
      },
      {
        id: 'b2',
        type: 'expense',
        amount: 349,
        description: 'SaaS & software licenses',
        datetime: '2026-07-05T09:00:00',
      },
      { id: 'b3', type: 'expense', amount: 890, description: 'Office equipment', datetime: '2026-07-07T14:00:00' },
      {
        id: 'b4',
        type: 'income',
        amount: 2400,
        description: 'Monthly consulting retainer',
        datetime: '2026-07-09T11:00:00',
      },
      { id: 'b5', type: 'expense', amount: 150, description: 'Accounting software', datetime: '2026-06-30T09:00:00' },
      {
        id: 'b6',
        type: 'income',
        amount: 5800,
        description: 'Client payment — Orion Labs',
        datetime: '2026-06-05T10:00:00',
      },
      {
        id: 'b7',
        type: 'expense',
        amount: 1200,
        description: 'Contractor invoice — design',
        datetime: '2026-06-12T14:00:00',
      },
      {
        id: 'b8',
        type: 'expense',
        amount: 420,
        description: 'Business travel & hotels',
        datetime: '2026-06-18T08:00:00',
      },
      {
        id: 'b9',
        type: 'income',
        amount: 2400,
        description: 'Monthly consulting retainer',
        datetime: '2026-06-09T11:00:00',
      },
      {
        id: 'b10',
        type: 'expense',
        amount: 85,
        description: 'Domain & hosting renewal',
        datetime: '2026-06-01T10:00:00',
      },
      {
        id: 'b11',
        type: 'income',
        amount: 3200,
        description: 'Project milestone — Apex Inc.',
        datetime: '2026-05-20T15:00:00',
      },
      {
        id: 'b12',
        type: 'expense',
        amount: 660,
        description: 'Marketing & ads spend',
        datetime: '2026-05-25T09:00:00',
      },
      {
        id: 'b13',
        type: 'income',
        amount: 2400,
        description: 'Monthly consulting retainer',
        datetime: '2026-05-09T11:00:00',
      },
      {
        id: 'b14',
        type: 'expense',
        amount: 199,
        description: 'Professional subscriptions',
        datetime: '2026-05-01T08:00:00',
      },
      {
        id: 'b15',
        type: 'expense',
        amount: 550,
        description: 'Client lunch & entertainment',
        datetime: '2026-07-02T13:00:00',
      },
      {
        id: 'b16',
        type: 'income',
        amount: 7200,
        description: 'Client payment — Halcyon Group',
        datetime: '2026-05-04T10:00:00',
      },
      { id: 'b17', type: 'expense', amount: 310, description: 'Courier & logistics', datetime: '2026-06-22T11:00:00' },
      {
        id: 'b18',
        type: 'expense',
        amount: 240,
        description: 'Coworking space — June',
        datetime: '2026-06-03T09:00:00',
      },
    ],
  },
];

export { SEED_WALLETS };
export type { SeedTransaction, SeedWallet };
