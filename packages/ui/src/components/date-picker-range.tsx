'use client';

import { RiCalendar2Line } from '@remixicon/react';
import { useId, useState } from 'react';
import { type DateRange } from 'react-day-picker';

import { DateFormat, formatDate, type DateFormat as DateFormatType } from '@vhnam/utils/date';

import { cn } from '../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Field, FieldLabel } from './field';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type DatePickerRangeProps = {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (dateRange: DateRange | undefined) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  numberOfMonths?: number;
  dateFormat?: DateFormatType;
  align?: 'start' | 'center' | 'end';
};

function formatRangeLabel(dateRange: DateRange | undefined, dateFormat: DateFormatType): React.ReactNode {
  if (!dateRange?.from) {
    return null;
  }

  if (dateRange.to) {
    return (
      <>
        {formatDate(dateRange.from, dateFormat)} - {formatDate(dateRange.to, dateFormat)}
      </>
    );
  }

  return formatDate(dateRange.from, dateFormat);
}

function DatePickerRange({
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Pick a date range',
  id: idProp,
  disabled = false,
  className,
  buttonClassName,
  numberOfMonths = 2,
  dateFormat = DateFormat.Numeric,
  align = 'start',
}: DatePickerRangeProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [internalValue, setInternalValue] = useState<DateRange | undefined>(defaultValue);
  const dateRange = value ?? internalValue;

  const handleSelect = (nextRange: DateRange | undefined) => {
    if (value === undefined) {
      setInternalValue(nextRange);
    }

    onChange?.(nextRange);
  };

  return (
    <Field className={cn('w-fit', className)} data-disabled={disabled}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              variant="outline"
              id={id}
              disabled={disabled}
              className={cn('justify-start px-2.5 font-normal', buttonClassName)}
            >
              <RiCalendar2Line className="size-4" data-icon="inline-start" />
              {formatRangeLabel(dateRange, dateFormat) ?? <span className="text-muted-foreground">{placeholder}</span>}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export { DatePickerRange };
export type { DatePickerRangeProps, DateRange as DatePickerRangeValue };
