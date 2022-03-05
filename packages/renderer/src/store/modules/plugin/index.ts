import { PluginStateTypes, PluginMetadata } from './types'
import { addHook, getHook, clearHook } from './hook'
import { registerData, addData, getData, registerAndGetData, clearData } from './data'
import { negate, once } from 'lodash-es'
import { matchPattern } from '@/utils'

export const usePluginStore = defineStore('plugin', {
  state: (): PluginStateTypes => ({
    url: '',
    plugins: [],
  }),
  actions: {
    getBuiltInPlugins() {
      once(() => {
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
      })()
    },
    loadAllPlugins(url: string) {
      this.url = url
      return Promise.allSettled(this.plugins.map(this.loadPlugin))
    },
    unloadAllPlugins() {
      clearHook()
      clearData()
    },
    loadPlugin(plugin: PluginMetadata) {
      if (plugin.setup) {
        const matchUrlPattern = (value: string | RegExp) => matchPattern(this.url, value)
        // 若指定了排除URL, 任意URL匹配就不加载
        if (plugin.urlExclude && plugin.urlExclude.some(matchUrlPattern)) {
          return false
        }
        // 若指定了包含URL, 所有URL都不匹配时不加载
        if (plugin.urlInclude && plugin.urlInclude.every(negate(matchUrlPattern))) {
          return false
        }
        return plugin.setup({
          addHook,
          addData,
        })
      }
      return null
    },
    addHook,
    getHook,
    registerData,
    addData,
    getData,
    registerAndGetData,
  },
})
