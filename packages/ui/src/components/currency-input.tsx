import * as React from 'react';

import {
  DEFAULT_CURRENCY_LOCALE,
  formatCurrencyInput,
  getCurrencyFractionDigits,
  getCurrencyInputCaretPosition,
  parseCurrencyInput,
} from '@vhnam/utils/currency';

import { Input } from '#/components/input';
import { cn } from '#/lib/utils';

type CurrencyInputProps = Omit<React.ComponentProps<'input'>, 'defaultValue' | 'onChange' | 'type' | 'value'> & {
  value?: string;
  currency?: string;
  onValueChange?: (value: string) => void;
};

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value);
        continue;
      }

      if (ref) {
        ref.current = value;
      }
    }
  };
}

function CurrencyInput({ className, currency = 'VND', onValueChange, ref, value = '', ...props }: CurrencyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const caretPositionRef = React.useRef<number | null>(null);
  const inputOptions = { locale: DEFAULT_CURRENCY_LOCALE, maximumFractionDigits: getCurrencyFractionDigits(currency) };
  const displayValue = formatCurrencyInput(value, inputOptions);

  React.useLayoutEffect(() => {
    if (caretPositionRef.current === null || !inputRef.current) {
      return;
    }

    inputRef.current.setSelectionRange(caretPositionRef.current, caretPositionRef.current);
    caretPositionRef.current = null;
  }, [displayValue]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextDisplayValue = event.target.value;
    const caretPosition = event.target.selectionStart ?? nextDisplayValue.length;
    const rawValue = parseCurrencyInput(nextDisplayValue, inputOptions);
    const formattedValue = formatCurrencyInput(rawValue, inputOptions);

    caretPositionRef.current = getCurrencyInputCaretPosition(nextDisplayValue, formattedValue, caretPosition);
    onValueChange?.(rawValue);
  }

  return (
    <Input
      ref={mergeRefs(inputRef, ref)}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={cn('font-mono', className)}
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}

export { CurrencyInput };
