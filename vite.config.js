import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/greek-words/",
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
});
