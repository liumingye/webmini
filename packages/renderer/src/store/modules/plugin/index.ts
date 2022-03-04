import { PluginStateTypes, PluginMetadata } from './types'
import { addHook, getHook, clearHook } from './hook'
import { negate } from 'lodash-es'

export const usePluginStore = defineStore('plugin', {
  state: (): PluginStateTypes => ({
    url: '',
    plugins: [],
  }),
  actions: {
    getBuiltInPlugins() {
      const context = import.meta.glob('../../../plugins/**/index.ts')
      const pluginPaths = Object.keys(context)
      pluginPaths
        .map(async (path) => {
          const loadModule = context[path]
          const module = await loadModule()
          if ('plugin' in module) {
            const plugin = module.plugin
            this.plugins.push(plugin)
          }
        })
        .filter((it) => it !== undefined)
      window.app.logger.info('built-in plugin was loaded successfully', { lable: 'pluginStore' })
    },
    loadAllPlugins(url: string) {
      this.url = url
      return Promise.allSettled(this.plugins.map(this.loadPlugin))
    },
    unloadAllPlugins() {
      clearHook()
    },
    matchPattern(str: string, pattern: string | RegExp) {
      if (typeof pattern === 'string') {
        return str.includes(pattern)
      }
      return pattern.test(str)
    },
    matchUrlPattern(pattern: string | RegExp) {
      return this.matchPattern(this.url, pattern)
    },
    loadPlugin(plugin: PluginMetadata) {
      if (plugin.setup) {
        // 若指定了排除URL, 任意URL匹配就不加载
        if (plugin.urlExclude && plugin.urlExclude.some(this.matchUrlPattern)) {
          return false
        }
        // 若指定了包含URL, 所有URL都不匹配时不加载
        if (plugin.urlInclude && plugin.urlInclude.every(negate(this.matchUrlPattern))) {
          return false
        }
        return plugin.setup({
          addHook,
          getHook,
        })
      }
      return null
    },
    addHook,
    getHook,
  },
})
