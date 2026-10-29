import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the same build works at a domain root locally and
  // under /cfb-career-sim/ on GitHub Pages.
  base: "./",
  build: { outDir: "dist" },
});
