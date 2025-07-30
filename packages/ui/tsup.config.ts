import { defineConfig } from 'tsup';
import { glob } from 'glob';
import path from 'path';

// Generate base component entries dynamically
const baseComponents = glob.sync('base/*.tsx').reduce((acc, file) => {
  const name = path.basename(file, '.tsx');
  acc[`base/${name}`] = file;
  return acc;
}, {} as Record<string, string>);

// Generate business component entries dynamically
const businessComponents = glob.sync('src/*/index.ts').reduce((acc, file) => {
  const dirname = path.dirname(file).replace('src/', '');
  acc[`${dirname}/index`] = file;
  return acc;
}, {} as Record<string, string>);

const hooks = glob.sync('src/hooks/**/index.ts').reduce((acc, file) => {
  const dirname = path.dirname(file).replace('src/hooks/', '');
  acc[`hooks/${dirname}`] = file;
  return acc;
}, {} as Record<string, string>);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    lib: 'lib/index.ts',
    ...businessComponents,
    ...baseComponents,
    ...hooks,
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: false,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime'
  ],
  target: 'es2017',
  splitting: true,
  treeshake: true,
  esbuildOptions(options) {
    options.alias = {
      '@': process.cwd(),
    };
  },
});