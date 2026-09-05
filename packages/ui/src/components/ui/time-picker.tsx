'use client';

import { useId, useState } from 'react';

import { Icon } from '#/components/icon';
import { Field, FieldLabel } from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import { cn } from '#/lib/cn';

type TimePickerProps = {
  /** 24-hour `HH:mm` string, matching the native `<input type="time">` value format. */
  value?: string;
  defaultValue?: string;
  onChange?: (time: string | undefined) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

function TimePicker({
  value,
  defaultValue,
  onChange,
  label,
  id: idProp,
  disabled = false,
  className,
  inputClassName,
}: TimePickerProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const time = value ?? internalValue ?? '';

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value || undefined;

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  }

  return (
    <Field className={cn('w-fit', className)} data-disabled={disabled}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <div className="relative">
        <Icon
          name="ClockIcon"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="time"
          id={id}
          value={time}
          onChange={handleChange}
          disabled={disabled}
          className={cn('pl-8', inputClassName)}
        />
      </div>
    </Field>
  );
}

export { TimePicker };
export type { TimePickerProps };
