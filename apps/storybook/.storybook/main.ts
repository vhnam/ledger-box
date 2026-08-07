import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import { mergeConfig } from 'vite';

import { ui } from '@vhnam/ui/vite';

/**
 * Split heavy UI vendors out of the Storybook iframe entry.
 * Keep matchers path-precise — broad `includes('react')` pulls Storybook shims
 * into the wrong chunk and can inflate the build.
 */
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (id.includes('@phosphor-icons/')) {
    return 'phosphor-icons';
  }

  if (id.includes('@base-ui/')) {
    return 'base-ui';
  }

  if (id.includes('react-day-picker/')) {
    return 'react-day-picker';
  }

  if (id.includes('date-fns/')) {
    return 'date-fns';
  }

  if (id.includes('axe-core/')) {
    return 'axe-core';
  }

  if (id.includes('next-themes/')) {
    return 'next-themes';
  }

  return undefined;
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  viteFinal: async (config, { configType }) => {
    const plugins = (config.plugins ?? []) as PluginOption[];
    plugins.push(tailwindcss() as PluginOption, ui() as PluginOption, react() as PluginOption);
    config.plugins = plugins;

    if (configType !== 'PRODUCTION') {
      return config;
    }

    return mergeConfig(config, {
      build: {
        rollupOptions: {
          output: {
            manualChunks: vendorChunk,
          },
        },
      },
    });
  },
};

export default config;
