import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

import { ui } from '@vhnam/ui/vite';

export default defineConfig({
  plugins: [tailwindcss(), ui(), tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
});
