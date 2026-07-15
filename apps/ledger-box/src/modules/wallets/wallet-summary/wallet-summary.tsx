import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { Skeleton } from '@vhnam/ui/components/skeleton';
import { cn } from '@vhnam/ui/lib/utils';

import { formatCurrency } from '@vhnam/utils/currency';

import type { TransactionQueryParams } from '#/queries/transactions/transaction.params';

import { useWalletSummary } from './wallet-summary.actions';

type WalletSummaryTone = 'income' | 'expense' | 'neutral';

interface WalletSummaryStat {
  label: string;
  value: number;
  icon: IconName;
  tone: WalletSummaryTone;
  highlightWhenNegative?: boolean;
  featured?: boolean;
}

const toneStyles: Record<WalletSummaryTone, { value: string; icon: string; iconBackground: string; label: string }> = {
  income: {
    value: 'text-emerald-400',
    icon: 'text-emerald-400',
    iconBackground: 'bg-emerald-400/10',
    label: 'text-muted-foreground',
  },
  expense: {
    value: 'text-rose-400',
    icon: 'text-rose-400',
    iconBackground: 'bg-rose-400/10',
    label: 'text-muted-foreground',
  },
  neutral: {
    value: 'text-foreground',
    icon: 'text-muted-foreground',
    iconBackground: 'bg-muted',
    label: 'text-muted-foreground',
  },
};

const negativeTextStyles = {
  value: 'text-rose-500',
  icon: 'text-rose-500',
  iconBackground: 'bg-rose-500/10',
  label: 'text-rose-500',
};

const negativeCardClassName = 'bg-rose-500/10 border-rose-500/30';

type WalletSummaryProps = {
  walletId: string;
  transactionQuery: Omit<TransactionQueryParams, 'page' | 'pageSize'>;
};

function WalletSummaryStatCard({ stat }: { stat: WalletSummaryStat }) {
  const isNegative = stat.highlightWhenNegative === true && stat.value < 0;
  const styles = isNegative ? { ...toneStyles[stat.tone], ...negativeTextStyles } : toneStyles[stat.tone];

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border p-3 md:p-4 flex flex-col gap-2',
        stat.featured && 'col-span-2 sm:col-span-1 flex-row md:flex-col items-center sm:items-start gap-3 sm:gap-2',
        isNegative && negativeCardClassName,
      )}
    >
      <div className={cn('flex size-10 items-center justify-center rounded-lg', styles.iconBackground)}>
        <Icon name={stat.icon} className={cn('size-6', styles.icon)} />
      </div>
      <div>
        <p className={cn('mb-0.5 text-xs', styles.label)}>{stat.label}</p>
        <p className={cn('font-mono truncate text-sm font-semibold leading-tight md:text-base', styles.value)}>
          {formatCurrency(stat.value)}
        </p>
      </div>
    </div>
  );
}

function WalletSummary({ walletId, transactionQuery }: WalletSummaryProps) {
  const { stats, isPending, isError } = useWalletSummary({ walletId, transactionQuery });

  if (isPending) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-card rounded-xl border border-border p-3 md:p-4 flex flex-col gap-2">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="mb-6 text-sm text-destructive">Failed to load wallet summary.</p>;
  }

  const walletSummaryStats: WalletSummaryStat[] = [
    {
      label: 'Income',
      value: stats.income,
      icon: 'TrendUpIcon',
      tone: 'income',
    },
    {
      label: 'Expenses',
      value: stats.expenses,
      icon: 'TrendDownIcon',
      tone: 'expense',
    },
    {
      label: 'Net balance',
      value: stats.netBalance,
      icon: 'ScalesIcon',
      tone: 'neutral',
      highlightWhenNegative: true,
      featured: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
      {walletSummaryStats.map((stat) => (
        <WalletSummaryStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

export { WalletSummary };
