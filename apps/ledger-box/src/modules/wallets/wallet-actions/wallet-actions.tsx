import { RiAddLine, RiArrowLeftRightLine, RiFilterLine, RiSettings2Line } from '@remixicon/react';

import { Button } from '@vhnam/ui/components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vhnam/ui/components/collapsible';
import { DatePickerRange } from '@vhnam/ui/components/date-picker-range';
import { Field, FieldLabel } from '@vhnam/ui/components/field';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@vhnam/ui/components/select';

import { DEFAULT_FILTER_VALUE, FILTER_OPTIONS_LIST } from '#/constants/filter-options';

import { useWalletActions } from './wallet-actions.actions';

function WalletActions() {
  const { filterBy, setFilterBy, dateRange, setDateRange, filterPreview, isDateRangeFilter } = useWalletActions();

  return (
    <Collapsible className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger
          render={
            <Button variant="outline">
              <RiFilterLine className="size-4" />
              Filter
            </Button>
          }
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <RiSettings2Line className="size-4" />
          </Button>
          <Button variant="secondary">
            <RiArrowLeftRightLine className="size-4" />
            <span className="hidden lg:block">Transfer</span>
          </Button>
          <Button variant="default">
            <RiAddLine className="size-4" />
            <span className="hidden lg:block">Add transaction</span>
          </Button>
        </div>
      </div>
      <CollapsibleContent>
        <div className="bg-sidebar p-4 rounded-lg flex items-center justify-between">
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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { WalletActions };
