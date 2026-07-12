import { RiArrowRightDownLine, RiArrowRightUpLine, RiScalesLine, type RemixiconComponentType } from '@remixicon/react';

import { Icon } from '@vhnam/ui/components/icon';

interface WalletSummaryStat {
  label: string;
  value: number;
  valueClassName: string;
  icon: RemixiconComponentType;
  iconClassName: string;
  iconBackgroundClassName: string;
}

const WALLET_SUMMARY_STATS: WalletSummaryStat[] = [
  {
    label: 'Income',
    value: 0,
    valueClassName: 'text-emerald-400',
    icon: RiArrowRightUpLine,
    iconClassName: 'text-emerald-400',
    iconBackgroundClassName: 'bg-emerald-400/10',
  },
  {
    label: 'Expenses',
    value: 0,
    valueClassName: 'text-rose-400',
    icon: RiArrowRightDownLine,
    iconClassName: 'text-rose-400',
    iconBackgroundClassName: 'bg-rose-400/10',
  },
  {
    label: 'Net Balance',
    value: 0,
    valueClassName: 'text-foreground',
    icon: RiScalesLine,
    iconClassName: 'text-muted-foreground',
    iconBackgroundClassName: 'bg-muted',
  },
];

function WalletSummary() {
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {WALLET_SUMMARY_STATS.map(({ label, value, valueClassName, icon, iconClassName, iconBackgroundClassName }) => (
        <div key={label} className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBackgroundClassName}`}>
            <Icon icon={icon} className={`h-4 w-4 ${iconClassName}`} />
          </div>
          <div>
            <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
            <p
              className={`truncate text-sm font-semibold leading-tight md:text-base ${valueClassName}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { WalletSummary };
