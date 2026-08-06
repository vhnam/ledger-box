import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type ComponentProps } from 'react';
import { expect } from 'storybook/test';

import { CurrencyInput } from '@vhnam/ui/components/currency-input';
import { Field, FieldDescription, FieldLabel } from '@vhnam/ui/components/field';

const meta = {
  title: 'Components/CurrencyInput',
  component: CurrencyInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CurrencyInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function CurrencyInputDemo(props: ComponentProps<typeof CurrencyInput>) {
  const [value, setValue] = useState(props.value ?? '');

  return <CurrencyInput {...props} value={value} onValueChange={setValue} />;
}

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <CurrencyInputDemo placeholder="Enter amount" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText('Enter amount');
    await userEvent.clear(input);
    await userEvent.type(input, '1234567');
    await expect(input).toHaveValue('1.234.567');
    await userEvent.clear(input);
    await userEvent.type(input, '000123');
    await expect(input).toHaveValue('123');
    await userEvent.clear(input);
    await userEvent.type(input, '0');
    await expect(input).toHaveValue('0');
    await userEvent.clear(input);
    await userEvent.type(input, '1,5');
    await expect(input).toHaveValue('15');
    await userEvent.clear(input);
    await expect(input).toHaveValue('');
  },
};

export const RefCallback: Story = {
  render: () => {
    function CurrencyInputRefDemo() {
      const [value, setValue] = useState('');
      const lastNode = useRef<HTMLInputElement | null>(null);

      return (
        <CurrencyInput
          value={value}
          onValueChange={setValue}
          placeholder="Enter amount"
          ref={(node) => {
            lastNode.current = node;
          }}
        />
      );
    }

    return <CurrencyInputRefDemo />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('Enter amount')).toBeVisible();
  },
};

export const InvalidRawValue: Story = {
  render: () => <CurrencyInput value="abc" onValueChange={() => {}} placeholder="Enter amount" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('Enter amount')).toHaveValue('');
  },
};

export const WithValue: Story = {
  render: () => (
    <div className="w-80">
      <CurrencyInputDemo value="1234567.89" aria-label="Amount" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <CurrencyInputDemo value="50000" disabled placeholder="Enter amount" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled();
  },
};

export const FrenchLocale: Story = {
  render: () => (
    <div className="w-80">
      <CurrencyInputDemo locale="fr-FR" currency="EUR" value="1234.56" aria-label="Amount" />
    </div>
  ),
  play: async ({ canvas }) => {
    // fr-FR's Intl group separator is U+202F (narrow no-break space), not a regular space.
    // Parsing edge cases for fr-FR separators are covered by input.test.ts, not keystroke
    // simulation here — simulated typing is unreliable for a non-ASCII group separator.
    await expect(canvas.getByRole('textbox')).toHaveValue('1 234,56');
  },
};

export const InField: Story = {
  render: () => (
    <div className="w-80">
      <Field>
        <FieldLabel htmlFor="amount">Amount</FieldLabel>
        <CurrencyInputDemo id="amount" placeholder="Enter amount" />
        <FieldDescription>Enter the transaction amount.</FieldDescription>
      </Field>
    </div>
  ),
};
