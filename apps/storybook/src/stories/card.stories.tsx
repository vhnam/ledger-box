import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@vhnam/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@vhnam/ui/components/card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Project content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Deploy</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm">
            ...
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">You have 3 unread notifications.</p>
      </CardContent>
    </Card>
  ),
};

export const Small: Story = {
  render: (args) => (
    <Card {...args} size="sm" className="w-80">
      <CardHeader>
        <CardTitle>Compact card</CardTitle>
        <CardDescription>Uses the sm size variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Less padding, smaller title.</p>
      </CardContent>
    </Card>
  ),
};
