import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { ui } from "@vhnam/ui/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [ui(), tanstackRouter({ target: "react", autoCodeSplitting: true }), react()],
});
