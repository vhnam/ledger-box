import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ui } from "@vhnam/ui/vite";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => ({
    ...config,
    plugins: [...(config.plugins ?? []), tailwindcss(), ui(), react()],
  }),
};

export default config;
