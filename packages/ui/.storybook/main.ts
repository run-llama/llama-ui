import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "msw-storybook-addon",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["./static"],
  viteFinal: async (config) => {
    // Enable TS path mapping
    config.plugins = [...(config.plugins || []), tsconfigPaths()];
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname, "../"),
      "@llamaindex/workflows-client": resolve(
        __dirname,
        "../../workflows-client/src"
      ),
      // Fix react-pdf compatibility with React 19
      react: resolve(__dirname, "../node_modules/react"),
      "react-dom": resolve(__dirname, "../node_modules/react-dom"),
    };

    // Ensure proper JSX handling
    config.esbuild = {
      ...config.esbuild,
      jsx: "automatic",
    };

    // Define React version for compatibility
    config.define = {
      ...config.define,
      "process.env.NODE_ENV": JSON.stringify("development"),
    };

    // pptx-svg ships a sibling main.wasm that is resolved via
    // `new URL('./main.wasm', import.meta.url)`. Vite's dep pre-bundler
    // relocates the JS into sb-vite/deps/ but does not copy the .wasm,
    // causing a 404. Excluding it from optimizeDeps preserves the
    // module's original location and the WASM resolves correctly.
    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [...(config.optimizeDeps?.exclude ?? []), "pptx-svg"],
    };

    return config;
  },
};
export default config;
