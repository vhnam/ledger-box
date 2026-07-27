'use client';

import { useId, useState } from 'react';

import { DateFormat, formatDate, type DateFormat as DateFormatType } from '@vhnam/utils/date';

import { Button } from '#/components/button';
import { Calendar } from '#/components/calendar';
import { Field, FieldLabel } from '#/components/field';
import { Icon } from '#/components/icon';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/popover';
import { cn } from '#/lib/utils';

type DatePickerProps = {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dateFormat?: DateFormatType;
  align?: 'start' | 'center' | 'end';
};

function DatePicker({
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Pick a date',
  id: idProp,
  disabled = false,
  className,
  buttonClassName,
  dateFormat = DateFormat.Numeric,
  align = 'start',
}: DatePickerProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [internalValue, setInternalValue] = useState<Date | undefined>(defaultValue);
  const date = value ?? internalValue;

  const handleSelect = (nextDate: Date | undefined) => {
    if (value === undefined) {
      setInternalValue(nextDate);
    }

    onChange?.(nextDate);
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
              {date ? formatDate(date, dateFormat) : <span className="text-muted-foreground">{placeholder}</span>}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar mode="single" defaultMonth={date} selected={date} onSelect={handleSelect} disabled={disabled} />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export { DatePicker };
export type { DatePickerProps };
