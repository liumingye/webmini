import { builtinModules } from 'module'
import { defineConfig } from 'vite'

export default defineConfig({
  root: __dirname,
  build: {
    outDir: '../../dist/preload',
    lib: {
      entry: 'index.ts',
      formats: ['cjs'],
      fileName: () => '[name].cjs',
    },
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron', ...builtinModules, 'winston', 'winston-daily-rotate-file'],
    },
  },
})
