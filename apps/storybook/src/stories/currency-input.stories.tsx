import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
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
