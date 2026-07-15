import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTheme } from 'next-themes';

import { Button } from '@vhnam/ui/components/button';
import { ThemeProvider } from '@vhnam/ui/components/theme-provider';

const meta = {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeProvider>;

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
  render: () => (
    <ThemeProvider>
      <ThemeToggleDemo />
    </ThemeProvider>
  ),
};
