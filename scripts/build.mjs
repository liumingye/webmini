import { build } from 'vite'

await build({ configFile: 'packages/renderer/vite.config.ts' })
await build({ configFile: 'packages/preload/vite.config.ts' })
await build({ configFile: 'packages/renderer/src/inject/vite.config.ts' })
await build({ configFile: 'packages/main/vite.config.ts' })
