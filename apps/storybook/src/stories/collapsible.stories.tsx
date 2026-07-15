import type { Meta, StoryObj } from '@storybook/react-vite';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vhnam/ui/components/collapsible';

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-80">
      <CollapsibleTrigger className="text-sm font-medium">Toggle wallet details</CollapsibleTrigger>
      <CollapsibleContent className="pt-2 text-sm text-muted-foreground">
        Balance, transactions, and settings for this wallet are shown here.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80">
      <CollapsibleTrigger className="text-sm font-medium">Toggle wallet details</CollapsibleTrigger>
      <CollapsibleContent className="pt-2 text-sm text-muted-foreground">
        Balance, transactions, and settings for this wallet are shown here.
      </CollapsibleContent>
    </Collapsible>
  ),
};
