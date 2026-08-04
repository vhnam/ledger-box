import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@vhnam/ui/components/select';

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'grapes', label: 'Grapes' },
  { value: 'pineapple', label: 'Pineapple' },
];

export const Default: Story = {
  render: () => (
    <Select items={fruits}>
      <SelectTrigger className="w-48" aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent aria-label="Fruits">
        {fruits.map((fruit) => (
          <SelectItem key={fruit.value} value={fruit.value}>
            {fruit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    const listbox = await waitFor(() => within(document.body).getByRole('listbox'));
    await userEvent.click(within(listbox).getByRole('option', { name: 'Apple' }));
    await expect(canvas.getByRole('combobox')).toHaveTextContent('Apple');
  },
};

const timezoneGroups = [
  {
    label: 'North America',
    timezones: [
      { value: 'est', label: 'Eastern Standard Time (EST)' },
      { value: 'cst', label: 'Central Standard Time (CST)' },
      { value: 'pst', label: 'Pacific Standard Time (PST)' },
    ],
  },
  {
    label: 'Europe',
    timezones: [
      { value: 'gmt', label: 'Greenwich Mean Time (GMT)' },
      { value: 'cet', label: 'Central European Time (CET)' },
    ],
  },
];

const timezones = timezoneGroups.flatMap((group) => group.timezones);

export const WithGroups: Story = {
  render: () => (
    <Select items={timezones}>
      <SelectTrigger className="w-48" aria-label="Select a timezone">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent aria-label="Timezones">
        {timezoneGroups.map((group, index) => (
          <Fragment key={group.label}>
            {index > 0 ? <SelectSeparator /> : null}
            <SelectGroup>
              <SelectLabel>{group.label}</SelectLabel>
              {group.timezones.map((timezone) => (
                <SelectItem key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </Fragment>
        ))}
      </SelectContent>
    </Select>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    const listbox = await waitFor(() => within(document.body).getByRole('listbox'));
    await userEvent.click(within(listbox).getByRole('option', { name: 'Central European Time (CET)' }));
    await expect(canvas.getByRole('combobox')).toHaveTextContent('Central European Time (CET)');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
  },
};

export const Small: Story = {
  render: () => (
    <Select items={fruits}>
      <SelectTrigger size="sm" className="w-48" aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent aria-label="Fruits">
        {fruits.map((fruit) => (
          <SelectItem key={fruit.value} value={fruit.value}>
            {fruit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    const listbox = await waitFor(() => within(document.body).getByRole('listbox'));
    await expect(listbox).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
  },
};

export const Disabled: Story = {
  render: () => (
    <Select disabled items={fruits}>
      <SelectTrigger className="w-48" aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent aria-label="Fruits">
        {fruits.map((fruit) => (
          <SelectItem key={fruit.value} value={fruit.value}>
            {fruit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toBeDisabled();
  },
};
