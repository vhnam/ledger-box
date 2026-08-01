/// <reference types="vite/client" />

import type { Preview } from '@storybook/react-vite';

import { ThemeProvider } from '@vhnam/ui/components/theme-provider';

import '../src/style.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
      config: {
        rules: [{ id: 'aria-hidden-focus', enabled: false }],
      },
    },
    viewport: {},
  },

  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <Story />
      </ThemeProvider>
    ),
  ],

  initialGlobals: {
    viewport: {
      value: 'desktop',
      isRotated: false,
    },
  },
};

export default preview;
