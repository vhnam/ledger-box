import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTheme } from 'next-themes';
import { expect } from 'storybook/test';

import { Button } from '@vhnam/ui/components/button';

const meta = {
  title: 'Components/ThemeProvider',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

function ThemeToggleDemo() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">Current theme: {theme}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setTheme('light')}>
          Light
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTheme('dark')}>
          Dark
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTheme('system')}>
          System
        </Button>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <ThemeToggleDemo />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText(/Current theme: light/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Dark' }));
    await expect(canvas.getByText(/Current theme: dark/)).toBeVisible();
  },
};
