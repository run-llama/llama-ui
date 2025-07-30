import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
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
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname, "../"),
      // Fix react-pdf compatibility with React 19
      "react": resolve(__dirname, "../node_modules/react"),
      "react-dom": resolve(__dirname, "../node_modules/react-dom"),
    };
    
    // Ensure proper JSX handling
    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
    };
    
    // Define React version for compatibility
    config.define = {
      ...config.define,
      "process.env.NODE_ENV": JSON.stringify("development"),
    };
    
    return config;
  },
};
export default config;
