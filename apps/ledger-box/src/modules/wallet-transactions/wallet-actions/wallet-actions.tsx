import { getRouteApi } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';
import { Icon } from '@vhnam/ui/components/icon';
import { Badge } from '@vhnam/ui/components/ui/badge';
import { Button } from '@vhnam/ui/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vhnam/ui/components/ui/collapsible';
import { Field, FieldLabel } from '@vhnam/ui/components/ui/field';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@vhnam/ui/components/ui/select';
import { Separator } from '@vhnam/ui/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@vhnam/ui/components/ui/toggle-group';
import { cn } from '@vhnam/ui/lib/cn';

import { DEFAULT_FILTER_VALUE, FILTER_OPTIONS_LIST } from '#/constants/filter-options';

import { useAppLocale } from '#/lib/locale/locale-context';

import { useWallets } from '#/queries/wallets/wallet.queries';

import { useWalletActions } from '#/modules/wallet-transactions/wallet-actions';
import { AddTransactionDialog } from '#/modules/wallet-transactions/wallet-add-transaction-dialog';
import { TransferMoneyDialog } from '#/modules/wallet-transactions/wallet-transfer-money-dialog';

const walletRouteApi = getRouteApi('/_app/wallets/$walletId/');

type WalletActionsProps = {
  hasTransactions: boolean;
  filters: ReturnType<typeof useWalletActions>;
};

function WalletActions({ hasTransactions, filters }: WalletActionsProps) {
  const intl = useIntl();
  const locale = useAppLocale();
  const {
    filterBy,
    setFilterBy,
    dateRange,
    setDateRange,
    filterPreview,
    isDateRangeFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    sortByOptions,
    sortOrderOptions,
  } = filters;

  const { walletId } = walletRouteApi.useParams();
  const { data: wallets = [] } = useWallets();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openTransferMoneyDialog, setOpenTransferMoneyDialog] = useState(false);
  const [openAddTransactionDialog, setOpenAddTransactionDialog] = useState(false);
  const canTransfer = wallets.length > 1;
  const isFiltered = filterBy !== DEFAULT_FILTER_VALUE;
  const activeFilter = FILTER_OPTIONS_LIST.find((option) => option.value === filterBy);

  const sortByItems = useMemo(
    () =>
      sortByOptions.map((option) => ({
        value: option.value,
        label: intl.formatMessage({ id: option.labelId, defaultMessage: option.defaultLabel }),
      })),
    [intl, sortByOptions],
  );

  const sortOrderItems = useMemo(
    () =>
      sortOrderOptions.map((option) => ({
        value: option.value,
        label: intl.formatMessage({ id: option.labelId, defaultMessage: option.defaultLabel }),
      })),
    [intl, sortOrderOptions],
  );

  return (
    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <CollapsibleTrigger
          disabled={!hasTransactions}
          render={
            <Button
              variant="outline"
              disabled={!hasTransactions}
              className={cn(
                'max-w-64 gap-1.5',
                isFiltered && 'border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10',
              )}
            >
              <Icon name="FunnelIcon" />
              <span className="truncate">
                {isFiltered && activeFilter ? (
                  <FormattedMessage id={activeFilter.labelId} defaultMessage={activeFilter.defaultLabel} />
                ) : (
                  <FormattedMessage id="wallet.actions.filter" defaultMessage="Filter" />
                )}
              </span>
              {filterPreview ? (
                <Badge variant="secondary" className="hidden max-w-28 truncate sm:inline-flex">
                  {filterPreview}
                </Badge>
              ) : null}
              <Icon
                name="CaretDownIcon"
                className={cn(
                  'size-3.5 shrink-0 opacity-60 transition-transform duration-200',
                  filtersOpen && 'rotate-180',
                )}
              />
            </Button>
          }
        />

        <div className="flex shrink-0 items-center gap-2">
          {canTransfer ? (
            <>
              <Button variant="secondary" onClick={() => setOpenTransferMoneyDialog(true)}>
                <Icon name="ArrowsLeftRightIcon" />
                <span className="hidden sm:inline">
                  <FormattedMessage id="wallet.actions.transfer" defaultMessage="Transfer" />
                </span>
              </Button>
              <TransferMoneyDialog
                open={openTransferMoneyDialog}
                onOpenChange={setOpenTransferMoneyDialog}
                walletId={walletId}
              />
            </>
          ) : null}
          <Button variant="default" onClick={() => setOpenAddTransactionDialog(true)}>
            <Icon name="PlusIcon" />
            <span className="hidden sm:inline">
              <FormattedMessage id="wallet.actions.addTransaction" defaultMessage="Add transaction" />
            </span>
          </Button>
          <AddTransactionDialog
            open={openAddTransactionDialog}
            onOpenChange={setOpenAddTransactionDialog}
            walletId={walletId}
          />
        </div>
      </div>

      <CollapsibleContent>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-3 md:p-4">
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-muted-foreground">
              <FormattedMessage id="wallet.actions.period" defaultMessage="Period" />
            </p>
            <ToggleGroup
              value={[filterBy]}
              onValueChange={(values) => {
                const nextValue = values.at(-1);
                if (!nextValue) {
                  return;
                }
                setFilterBy(nextValue as typeof filterBy);
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex w-full flex-wrap rounded-xl bg-muted/50 p-1"
            >
              {FILTER_OPTIONS_LIST.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'grow border-0 px-2.5 sm:grow-0',
                    'aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm',
                  )}
                >
                  <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {isDateRangeFilter ? (
              <DatePickerRange
                value={dateRange}
                onChange={setDateRange}
                locale={locale}
                placeholder={intl.formatMessage({
                  id: 'wallet.actions.dateRangePlaceholder',
                  defaultMessage: 'Choose dates',
                })}
              />
            ) : null}

            {filterPreview ? <p className="text-sm text-muted-foreground">{filterPreview}</p> : null}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <Field className="w-fit" orientation="horizontal">
              <FieldLabel className="text-muted-foreground">
                <FormattedMessage id="wallet.actions.sortBy" defaultMessage="Sort by" />
              </FieldLabel>
              <Select items={sortByItems} value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={intl.formatMessage({ id: 'wallet.actions.sortBy', defaultMessage: 'Sort by' })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {sortByOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="w-fit" orientation="horizontal">
              <FieldLabel className="text-muted-foreground">
                <FormattedMessage id="wallet.actions.order" defaultMessage="Order" />
              </FieldLabel>
              <Select
                items={sortOrderItems}
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as typeof sortOrder)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={intl.formatMessage({ id: 'wallet.actions.order', defaultMessage: 'Order' })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {sortOrderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { WalletActions };
