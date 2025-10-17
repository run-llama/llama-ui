import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const { version } = require("./package.json");

// Build as a library that emits only JS/CSS assets with versioned filenames
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "WorkflowDebugger",
      formats: ["iife"],
      fileName: () => `debugger.v${version}.js`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          // Force CSS to use versioned filename as well
          const name =
            assetInfo.name || (assetInfo.names && assetInfo.names[0]) || "";
          if (typeof name === "string" && name.endsWith(".css")) {
            return `debugger.v${version}.css`;
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
}));
