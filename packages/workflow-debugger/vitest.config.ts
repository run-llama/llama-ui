import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "tests/test-setup.ts")],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
  define: {
    "process.env": process.env,
  },
});
