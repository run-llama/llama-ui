import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    projects: [
      // Unit tests
      {
        resolve: {
          alias: {
            "@llamaindex/ui": path.resolve(__dirname, "../ui"),
            "@": path.resolve(__dirname, "../ui"),
          },
        },
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./src/test-setup.ts"],
          globals: true,
          include: ["unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
          exclude: ["e2e/**/*"],
        },
      },
      // Storybook tests
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(__dirname, "../ui/.storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: ["./src/storybook-setup.ts"],
        },
      },
    ],
  },
  define: {
    "process.env": process.env,
  },
});