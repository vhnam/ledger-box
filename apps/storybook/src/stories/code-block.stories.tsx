import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { CodeBlock } from '@vhnam/ui/components/code-block';

const sampleJson = `{
  "before": {
    "name": "Household",
    "balance": 1200000
  },
  "after": {
    "name": "Household",
    "balance": 1150000
  }
}`;

const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Json: Story = {
  args: {
    code: sampleJson,
    language: 'json',
    className: 'w-96',
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('code')).toHaveTextContent('Household'));
  },
};

export const EmptyObject: Story = {
  args: {
    code: '{}',
    language: 'json',
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('code')).toHaveTextContent('{}'));
  },
};
