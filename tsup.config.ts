import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => ({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: !options.watch,
  dts: true,
  sourcemap: true,
  ...options,
}));
