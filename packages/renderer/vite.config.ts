import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pkg from '../../package.json'
import { resolve } from 'path'
import vueJsx from '@vitejs/plugin-vue-jsx'
import WindiCSS from 'vite-plugin-windicss'
import OptimizationPersist from 'vite-plugin-optimize-persist'
import PkgConfig from 'vite-plugin-package-config'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
// import { dirResolver, DirResolverHelper } from 'vite-auto-import-resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  plugins: [
    // 将包信息文件作为 vite 的配置文件之一，为 vite-plugin-optimize-persist 所用
    PkgConfig(),
    // 依赖预构建分析，提高大型项目性能
    OptimizationPersist(),
    // vue 官方插件，用来解析 sfc
    vue(),
    // 按需加载
    Components({
      dts: './src/components.d.ts',
      resolvers: [ArcoResolver({ importStyle: false })],
    }),
    // tsx 支持
    vueJsx(),
    // windicss 插件
    WindiCSS(),
    // api 自动按需引入
    AutoImport({
      dts: './src/auto-imports.d.ts',
      imports: ['vue', 'pinia', 'vue-router'],
      eslintrc: {
        enabled: true,
      },
    }),
  ],
  base: './',
  build: {
    emptyOutDir: true,
    outDir: '../../dist/renderer',
  },
  server: {
    port: pkg.env.PORT,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "${resolve(__dirname, './src/assets/css/css-variables.less')}";`,
      },
    },
  },
})
