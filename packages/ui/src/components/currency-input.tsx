import * as React from 'react';

import {
  DEFAULT_CURRENCY_INPUT_OPTIONS,
  formatCurrencyInput,
  getCurrencyInputCaretPosition,
  parseCurrencyInput,
} from '@vhnam/utils/currency';

import { cn } from '../lib/utils';
import { Input } from './input';

type CurrencyInputProps = Omit<React.ComponentProps<'input'>, 'defaultValue' | 'onChange' | 'type' | 'value'> & {
  value?: string;
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

function CurrencyInput({ className, onValueChange, ref, value = '', ...props }: CurrencyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const caretPositionRef = React.useRef<number | null>(null);
  const displayValue = formatCurrencyInput(value, DEFAULT_CURRENCY_INPUT_OPTIONS);

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
    const rawValue = parseCurrencyInput(nextDisplayValue, DEFAULT_CURRENCY_INPUT_OPTIONS);
    const formattedValue = formatCurrencyInput(rawValue, DEFAULT_CURRENCY_INPUT_OPTIONS);

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
