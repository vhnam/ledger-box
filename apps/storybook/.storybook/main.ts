import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';

import { ui } from '@vhnam/ui/vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    const plugins = (config.plugins ?? []) as PluginOption[];
    plugins.push(tailwindcss() as PluginOption, ui() as PluginOption, react() as PluginOption);
    config.plugins = plugins;
    return config;
  },
};

export default config;
