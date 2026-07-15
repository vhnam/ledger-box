import { Button } from '@vhnam/ui/components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vhnam/ui/components/collapsible';
import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';
import { Field, FieldLabel } from '@vhnam/ui/components/field';
import { Icon } from '@vhnam/ui/components/icon';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';

import { DEFAULT_FILTER_VALUE, FILTER_OPTIONS_LIST } from '#/constants/filter-options';

import { useWalletActions } from './wallet-actions.actions';

type WalletActionsProps = {
  hasTransactions: boolean;
  filters: ReturnType<typeof useWalletActions>;
};

function WalletActions({ hasTransactions, filters }: WalletActionsProps) {
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

  return (
    <Collapsible className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger
          disabled={!hasTransactions}
          render={
            <Button variant="outline" disabled={!hasTransactions}>
              <Icon name="FunnelIcon" />
              Filter
            </Button>
          }
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Icon name="GearSixIcon" />
          </Button>
          <Button variant="secondary">
            <Icon name="ArrowsLeftRightIcon" />
            <span className="hidden lg:block">Transfer</span>
          </Button>
          <Button variant="default">
            <Icon name="PlusIcon" />
            <span className="hidden lg:block">Add transaction</span>
          </Button>
        </div>
      </div>
      <CollapsibleContent>
        <div className="bg-sidebar p-4 rounded-lg flex flex-wrap items-center gap-4">
          <Field className="w-fit" orientation="horizontal">
            <FieldLabel>Filter by</FieldLabel>
            <Select
              items={FILTER_OPTIONS_LIST}
              defaultValue={DEFAULT_FILTER_VALUE}
              value={filterBy}
              onValueChange={(value) => setFilterBy(value as typeof filterBy)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS_LIST.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {filterPreview ? <p className="text-sm font-medium text-muted-foreground">{filterPreview}</p> : null}

          {isDateRangeFilter ? <DatePickerRange value={dateRange} onChange={setDateRange} numberOfMonths={1} /> : null}

          <Field className="w-fit" orientation="horizontal">
            <FieldLabel>Sort by</FieldLabel>
            <Select items={sortByOptions} value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortByOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field className="w-fit" orientation="horizontal">
            <FieldLabel>Order</FieldLabel>
            <Select
              items={sortOrderOptions}
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as typeof sortOrder)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                {sortOrderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
