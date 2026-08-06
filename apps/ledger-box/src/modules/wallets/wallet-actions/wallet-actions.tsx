import { getRouteApi } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@vhnam/ui/components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vhnam/ui/components/collapsible';
import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';
import { Field, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';

import { DEFAULT_FILTER_VALUE, FILTER_OPTIONS_LIST } from '#/constants/filter-options';
import { useWalletActions } from '#/modules/wallets/wallet-actions/wallet-actions.actions';
import { AddTransactionDialog } from '#/modules/wallets/wallet-add-transaction-dialog';
import { TransferMoneyDialog } from '#/modules/wallets/wallet-transfer-money-dialog';
import { useWallets } from '#/queries/wallets/wallet.queries';

const walletRouteApi = getRouteApi('/_app/wallets/$walletId/');

type WalletActionsProps = {
  hasTransactions: boolean;
  filters: ReturnType<typeof useWalletActions>;
};

function WalletActions({ hasTransactions, filters }: WalletActionsProps) {
  const intl = useIntl();
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
  const [openTransferMoneyDialog, setOpenTransferMoneyDialog] = useState(false);
  const [openAddTransactionDialog, setOpenAddTransactionDialog] = useState(false);
  const canTransfer = wallets.length > 1;

  const filterItems = useMemo(
    () =>
      FILTER_OPTIONS_LIST.map((option) => ({
        value: option.value,
        label: intl.formatMessage({ id: option.labelId, defaultMessage: option.defaultLabel }),
      })),
    [intl],
  );

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
    <Collapsible className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger
          disabled={!hasTransactions}
          render={
            <Button variant="outline" disabled={!hasTransactions}>
              <Icon name="FunnelIcon" />
              <FormattedMessage id="wallet.actions.filter" defaultMessage="Filter" />
            </Button>
          }
        />
        <div className="flex items-center gap-2">
          {canTransfer ? (
            <>
              <Button variant="secondary" onClick={() => setOpenTransferMoneyDialog(true)}>
                <Icon name="ArrowsLeftRightIcon" />
                <span className="hidden lg:block">
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
            <span className="hidden lg:block">
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
        <div className="bg-sidebar p-4 rounded-lg flex flex-wrap items-center gap-4">
          <Field className="w-fit" orientation="horizontal">
            <FieldLabel>
              <FormattedMessage id="wallet.actions.filterBy" defaultMessage="Filter by" />
            </FieldLabel>
            <Select
              items={filterItems}
              defaultValue={DEFAULT_FILTER_VALUE}
              value={filterBy}
              onValueChange={(value) => setFilterBy(value as typeof filterBy)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={intl.formatMessage({ id: 'wallet.actions.filterBy', defaultMessage: 'Filter by' })}
                />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS_LIST.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <FormattedMessage id={option.labelId} defaultMessage={option.defaultLabel} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {filterPreview ? <p className="text-sm font-medium text-muted-foreground">{filterPreview}</p> : null}

          {isDateRangeFilter ? <DatePickerRange value={dateRange} onChange={setDateRange} numberOfMonths={1} /> : null}

          <Field className="w-fit" orientation="horizontal">
            <FieldLabel>
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
            <FieldLabel>
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
      </CollapsibleContent>
    </Collapsible>
  );
}

export { WalletActions };
