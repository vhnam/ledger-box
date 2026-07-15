import { Icon, type IconName } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';
import { cn } from '@vhnam/ui/lib/utils';

import { useWalletSummary } from './wallet-summary.actions';

interface WalletSummaryStat {
  label: string;
  value: number;
  valueClassName: string;
  icon: IconName;
  iconClassName: string;
  iconBackgroundClassName: string;
}

type WalletSummaryProps = {
  walletId: string;
};

function WalletSummary({ walletId }: WalletSummaryProps) {
  const { stats, isPending, isError } = useWalletSummary(walletId);

  if (isPending) {
    return (
      <div className="mb-6 flex justify-center py-8">
        <Spinner className="size-8 text-muted-foreground" />
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
      valueClassName: 'text-emerald-400',
      icon: 'TrendUpIcon',
      iconClassName: 'text-emerald-400',
      iconBackgroundClassName: 'bg-emerald-400/10',
    },
    {
      label: 'Expenses',
      value: stats.expenses,
      valueClassName: 'text-rose-400',
      icon: 'TrendDownIcon',
      iconClassName: 'text-rose-400',
      iconBackgroundClassName: 'bg-rose-400/10',
    },
    {
      label: 'Net Balance',
      value: stats.netBalance,
      valueClassName: 'text-foreground',
      icon: 'ScalesIcon',
      iconClassName: 'text-muted-foreground',
      iconBackgroundClassName: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
      {walletSummaryStats.map(
        ({ label, value, valueClassName, icon, iconClassName, iconBackgroundClassName }, index) => (
          <div
            key={label}
            className={cn(
              'bg-card rounded-xl border border-border p-3 md:p-4 flex gap-2',
              index === 2 && 'col-span-2 sm:col-span-1 items-center sm:items-start gap-3 sm:gap-2',
            )}
          >
            <div className={cn('flex size-10 items-center justify-center rounded-lg', iconBackgroundClassName)}>
              <Icon name={icon} className={cn('size-6', iconClassName)} />
            </div>
            <div>
              <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
              <p className={cn('font-mono truncate text-sm font-semibold leading-tight md:text-base', valueClassName)}>
                {value.toLocaleString()}
              </p>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export { WalletSummary };
