import { builtinModules } from 'module'
import { defineConfig } from 'vite'
import pkg from '../../package.json'
import { resolve } from 'path'

export default defineConfig({
  root: __dirname,
  base: './',
  resolve: {
    alias: {
      '~': resolve(__dirname, '../'),
    },
  },
  build: {
    outDir: '../../dist/main',
    lib: {
      entry: 'index.ts',
      formats: ['cjs'],
      fileName: () => '[name].cjs',
    },
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron', ...builtinModules, ...Object.keys(pkg.dependencies || {})],
    },
  },
})
