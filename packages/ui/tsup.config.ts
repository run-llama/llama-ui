import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/file-uploader/index.ts',
    'src/extracted-data/index.ts',
    'src/file-preview/index.ts',
    'src/item-grid/index.ts',
    'src/processing-steps/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: false,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'next-themes',
    'tailwindcss',
    'react-pdf',
    'pdfjs-dist',
  ],
  target: 'es2017',
  splitting: false,
  treeshake: true,
  esbuildOptions(options) {
    options.alias = {
      '@': process.cwd(),
    };
  },
});

console.log(process.cwd());