'use client';

import { useId, useState } from 'react';
import { type DateRange } from 'react-day-picker';

import { DateFormat, formatDate, LOCALE_DATE_FNS_LOCALE, type DateFormat as DateFormatType } from '@vhnam/utils/date';
import type { SupportedLocale } from '@vhnam/utils/locale';

import { Button } from '#/components/button';
import { Calendar } from '#/components/calendar';
import { Field, FieldLabel } from '#/components/field';
import { Icon } from '#/components/icon';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/popover';
import { cn } from '#/lib/utils';

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
  locale?: SupportedLocale;
  align?: 'start' | 'center' | 'end';
};

function formatRangeLabel(
  dateRange: DateRange | undefined,
  dateFormat: DateFormatType,
  locale?: SupportedLocale,
): React.ReactNode {
  if (!dateRange?.from) {
    return null;
  }

  if (dateRange.to) {
    return (
      <>
        {formatDate(dateRange.from, dateFormat, locale)} - {formatDate(dateRange.to, dateFormat, locale)}
      </>
    );
  }

  return formatDate(dateRange.from, dateFormat, locale);
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
  locale,
  align = 'start',
}: DatePickerRangeProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [internalValue, setInternalValue] = useState<DateRange | undefined>(defaultValue);
  const dateRange = value ?? internalValue;
  const dayPickerLocale = locale ? LOCALE_DATE_FNS_LOCALE[locale] : undefined;

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
              <Icon name="CalendarBlankIcon" data-icon="inline-start" />
              {formatRangeLabel(dateRange, dateFormat, locale) ?? (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align={align} aria-label={label ?? 'Choose date range'}>
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            disabled={disabled}
            locale={dayPickerLocale}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export { DatePickerRange };
export type { DatePickerRangeProps, DateRange as DatePickerRangeValue };
