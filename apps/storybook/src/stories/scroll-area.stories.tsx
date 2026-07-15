import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScrollArea } from '@vhnam/ui/components/scroll-area';
import { Separator } from '@vhnam/ui/components/separator';

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 50 }, (_, i) => `Tag ${i + 1}`);

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-lg border">
      <div className="p-4">
        <h4 className="font-heading mb-4 text-sm leading-none font-medium">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 rounded-lg border whitespace-nowrap">
      <div className="flex w-max gap-4 p-4">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-muted text-sm">
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
