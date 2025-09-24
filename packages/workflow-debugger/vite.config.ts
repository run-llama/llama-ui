import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "app.js",
        chunkFileNames: "app.js",
        assetFileNames: (assetInfo) => {
          if (
            assetInfo.names.length &&
            assetInfo.names.some((name) => name.endsWith(".css"))
          ) {
            return "app.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});
