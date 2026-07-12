import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { ui } from "@vhnam/ui/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    tailwindcss(),
    ui(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
});
