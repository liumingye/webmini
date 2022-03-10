import { builtinModules } from 'module'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import pkg from '../../package.json'

export default defineConfig({
  root: __dirname,
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  build: {
    outDir: '../../dist/inject',
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
